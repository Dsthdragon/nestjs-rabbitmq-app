"use strict";
require("dotenv").config();
const amqp = require("amqplib/callback_api");

console.log(process.env.RABBIT_MQ_URL);
amqp.connect(process.env.RABBIT_MQ_URL, function (error0, connection) {
  console.log("i am here pleases");
  if (error0) {
    throw error0;
  }
  connection.createChannel(function (error1, channel) {
    if (error1) {
      throw error1;
    }

    var queue = "sent-customers";

    channel.assertQueue(queue, { durable: false });

    console.log(`[*] Waiting for messages in ${queue}`);

    channel.consume(
      queue,
      function (msg) {
        console.log("Message received");
        console.log(msg.content.toString());
      },
      {
        noAck: true,
      }
    );
  });
});
