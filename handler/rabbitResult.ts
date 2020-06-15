const amqp = require('amqplib');
const nodemailer = require('nodemailer')
import { IResponse } from "../interface/interfaceCollection";
import { mailerForVerification, getURL } from "./account"
import * as jwt from "jsonwebtoken"
import * as fs from "fs"
require('dotenv').config();
//reference: https://manifold.co/blog/asynchronous-microservices-with-rabbitmq-and-node-js

export async function resultHandler() {
    const messageQueueConnectionString = process.env.CLOUDAMQP_URL;
    let connection : any = await amqp.connect(messageQueueConnectionString);
    
    // create channel and prefetch 1 message at a time
    let channel : any = await connection.createChannel();
    await channel.prefetch(1);

    //start consuming messages
    await consume({connection, channel})

    function consume({ connection, channel}) {
        return new Promise((resolve,reject)=> {
            channel.consume("processing.results", async function (msg) {
                let msgBody = msg.content.toString();
                let data = JSON.parse(msgBody);
                if (data.Status == 'Failed'){
                    data = await errorActionSelector(data)
                }
                console.log("Processing result :", data)

                //acknowledge message as received
                await channel.ack(msg);

                connection.on("close", (err) => {
                    return reject(err);
                });

                connection.on("error", (err) => {
                    return reject(err);
                })
            })
        })
    }
}

async function errorActionSelector(data : any) : Promise<IResponse> {
    let resp : IResponse = {Status:'',Message:''}
    if (data.Action == 'existingUsernameFailure'){
        resp = await mailerForAlreadyExistingUsername(data.Email)
    }
    else if (data.Action == 'resendVerification'){
        const url:string = await getURL()
        //add token to url for added security
        const privateKey : Buffer = fs.readFileSync(__dirname.concat('/jwtRS256.key'))
        const passphrase : any = process.env.JWT_PASSPHRASE
        const token : string = jwt.sign({username:data.username}, {key: privateKey, passphrase: passphrase }, {algorithm:"RS256", expiresIn: 1800});
        resp = await mailerForVerification(data.email, url.concat('/account/verify','/',data.username,'/',token))
        if (resp.Status == 'Success') {
            resp.Code = 200
        }
        else {
            resp.Code = 500
        }
    }
    else if (data.Action == 'logError') {
        resp = data
    }
    else if (data.Action == 'standardLog') {
        resp = data
    }
    return resp
}

async function mailerForAlreadyExistingUsername(email:string) : Promise<IResponse> {
    let resp : IResponse = {Status:'',Message:''}
    try {
        const transporter:any = nodemailer.createTransport({
            service:'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const mailOptions:any = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Registration Failed',
            text: 'Email has already been registered. Please register your account with a different email'
        };

        const mailerResult = await transporter.sendMail(mailOptions)
        resp.Status = 'Success'
        resp.Message = 'Notification email has been sent'
        resp.Detail = mailerResult
    }
    catch (e) {
        resp.Status = 'Failed'
        resp.Message = 'Email failed to be sent'
        resp.Detail = e
    }
    return resp
}