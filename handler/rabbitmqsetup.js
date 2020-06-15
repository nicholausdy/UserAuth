"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require('dotenv').config();
const amqp = require('amqplib');
//reference: https://manifold.co/blog/asynchronous-microservices-with-rabbitmq-and-node-js
async function setupRabbitMQ() {
    console.log(process.env.CLOUDAMQP_URL);
    const messageQueueConnectionString = process.env.CLOUDAMQP_URL;
    console.log("Setting up RabbitMQ Exchanges/Queues");
    //connect to RabbitMQ instance on cloud
    const connection = await amqp.connect(messageQueueConnectionString);
    //create channel
    const channel = await connection.createChannel();
    //create exchange -> exchange is needed for routing to appropriate queues
    await channel.assertExchange("processing", "direct", { durable: true }); //exchange survives broker restart
    //create 2 queues: request and result
    await channel.assertQueue("processing.requests", { durable: true });
    await channel.assertQueue("processing.results", { durable: true });
    //bind queues to exchange 
    await channel.bindQueue("processing.requests", "processing", "request");
    await channel.bindQueue("processing.results", "processing", "result");
    console.log("RabbitMQ setup done");
    process.exit();
}
exports.setupRabbitMQ = setupRabbitMQ;
