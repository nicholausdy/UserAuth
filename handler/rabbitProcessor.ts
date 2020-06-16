import * as accountHandler from "./account"
import * as accountRedisInterface from "../redisInterface/account"
import { IResponse } from "../interface/interfaceCollection";
import * as accountDBInterface from "../dbInterface/account"
import * as profileDBInterface from "../dbInterface/profile"
require('dotenv').config();
const amqp = require('amqplib')
const perf = require('execution-time')();
//reference: https://manifold.co/blog/asynchronous-microservices-with-rabbitmq-and-node-js

const messageQueueConnectionString = process.env.CLOUDAMQP_URL;

export async function processorHandler() {
    //connect to RabbitMQ
    
    let connection : any = await amqp.connect(messageQueueConnectionString);

    // create a channel and prefetch 1 message at a time
    let channel : any = await connection.createChannel()
    await channel.prefetch(1)

    //create a second channel to send back the results
    let resultsChannel = await connection.createConfirmChannel();

    //start consuming messages
    await consume({connection, channel, resultsChannel})  
}

function publishToChannel(channel, {routingKey, exchangeName, data}) {
    return new Promise((resolve, reject) => {
        channel.publish(exchangeName, routingKey, Buffer.from(JSON.stringify(data),'utf-8'), {persistent : true}, function (err,ok){
            if (err) {
                return reject(err)
            }
            resolve();
        })
    })
}

// consume messages from RabbitMQ
function consume({ connection, channel, resultsChannel }) {
    return new Promise((resolve, reject) => {
      channel.consume("processing.requests", async function (msg) {
        // parse message
        perf.start();
        let msgBody = msg.content.toString();
        let requestData = JSON.parse(msgBody);
        console.log("Received a request message :", requestData);
  
        // process data
        let processingResults = await actionSelector(requestData);
  
        // publish results to channel
        await publishToChannel(resultsChannel, {
          exchangeName: "processing",
          routingKey: "result",
          data: processingResults
        });
        console.log("Published results for :", processingResults);
  
        // acknowledge message as processed successfully
        await channel.ack(msg); 
        
        const result : any = perf.stop();
        console.log('Time to process RabbitMQ queue',result.time)
      });
  
      // handle connection closed
      connection.on("close", (err) => {
        return reject(err);
      });
  
      // handle errors
      connection.on("error", (err) => {
        return reject(err);
      });
    });
  }

async function actionSelector(requestData : any) : Promise<IResponse>  {
  let processingResult : IResponse = {Status:'Failed',Code:500,Message:'Unknown error encountered'}
  if (requestData.action == 'registerAccount'){  
    processingResult = await accountHandler.commitAccounttoDB(requestData)
    if (processingResult.Status == 'Failed') {
      await Promise.all([accountRedisInterface.deleteAccount(requestData.user_id), accountRedisInterface.deleteProfile(requestData.user_id), accountRedisInterface.deleteAccountMapping(requestData.email)])
      if (processingResult.Message == 'Username already exists'){
        const getResult : IResponse = await accountDBInterface.readAccountByEmail(requestData.email)
        const getNamaLengkapResult : IResponse = await accountDBInterface.readProfile(getResult.Message.user_id)
        const insertRedis : IResponse = await accountRedisInterface.registerAccount(getResult.Message.user_id, getResult.Message.email, getResult.Message.password, getResult.Message.isverified, getResult.Message.tempcode, getNamaLengkapResult.Message.nama_lengkap)
      }
    }
  }
  else if (requestData.action == 'updateVerification'){
    processingResult = await accountDBInterface.updateVerification(requestData.user_id,true)
    processingResult.Code = 200
  }
  else if (requestData.action == 'logError') {
    processingResult = requestData
    processingResult.Action = requestData.action
  }
  else if (requestData.action == 'standardLog') {
    processingResult = requestData
    processingResult.Action = requestData.action
  }
  else if (requestData.action == 'insertTempCode'){
   processingResult = await accountDBInterface.updateTempCode(requestData.email,requestData.tempcode)
   processingResult.Code = 200 
  }
  else if (requestData.action == 'deleteTempCode'){
    processingResult = await accountDBInterface.deleteTempCode(requestData.email)
    processingResult.Code = 200
  }
  else if (requestData.action == 'requestChangePassword'){
    processingResult = await accountHandler.mailerForChangingPassword(requestData.email,requestData.tempcode)
    if (processingResult.Status == 'Success'){
      processingResult.Code = 200
    }
    else {
      processingResult.Code = 500
    }
  }
  else if (requestData.action == 'changePassword'){
    processingResult = await accountDBInterface.updatePassword(requestData.email, requestData.password)
    if (processingResult.Status == 'Success') {
      processingResult = await accountDBInterface.deleteTempCode(requestData.email)
      if (processingResult.Status == 'Success'){
        processingResult.Code = 200
      }
      else {
        processingResult.Code = 500
      }
    }
    else {
      processingResult.Code = 500
    }
  }
  else if (requestData.action == 'updateProfile'){
    processingResult = await profileDBInterface.updateProfile(requestData.user_id, requestData.nama_lengkap, requestData.idkaryawan, requestData.no_hp, requestData.email_2)
    if (processingResult.Status == 'Success'){
      processingResult.Code = 200
    }
    else {
      processingResult.Code = 500
    }
  }
  return processingResult
}
  
  
