"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const amqp = require('amqplib');
require('dotenv').config();
//reference: https://manifold.co/blog/asynchronous-microservices-with-rabbitmq-and-node-js
async function requestHandler(req) {
    let resp = { Status: '', Message: '' };
    try {
        const messageQueueConnectionString = process.env.CLOUDAMQP_URL;
        let connection = await amqp.connect(messageQueueConnectionString);
        let channel = await connection.createConfirmChannel();
        await publishToChannel(channel, { routingKey: "request", exchangeName: "processing", data: req });
        console.log(req.body);
        resp.Status = 'Success';
        resp.Code = 200;
        resp.Message = 'Submission done. Wait for verification email';
    }
    catch (e) {
        resp.Status = 'Failed';
        resp.Code = 500;
        resp.Message = 'Fail to publish request';
        resp.Detail = e;
    }
    finally {
        return resp;
    }
    function publishToChannel(channel, { routingKey, exchangeName, data }) {
        return new Promise((resolve, reject) => {
            channel.publish(exchangeName, routingKey, Buffer.from(JSON.stringify(data), 'utf-8'), { persistent: true }, function (err, ok) {
                if (err) {
                    return reject(err);
                }
                resolve();
            });
        });
    }
}
exports.requestHandler = requestHandler;
