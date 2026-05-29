const { ServiceBusClient } = require("@azure/service-bus");
require('dotenv').config();

const connectionString = process.env.SERVICEBUS_CONNECTION_STRING;
const topicName = process.env.SERVICEBUS_TOPIC_NAME || "domain-events";

let sbClient = null;
let sender = null;

if (connectionString) {
    try {
        sbClient = new ServiceBusClient(connectionString);
        sender = sbClient.createSender(topicName);
        console.log(`Connected to Azure Service Bus Topic: ${topicName}`);
    } catch (err) {
        console.error('Failed to connect to Service Bus: ', err);
    }
} else {
    console.warn('SERVICEBUS_CONNECTION_STRING is not set. Event publishing is disabled.');
}

async function publishEvent(eventType, payload) {
    if (!sender) {
        console.warn('Cannot publish event: sender is not initialized.');
        return;
    }

    try {
        const message = {
            body: payload,
            applicationProperties: {
                eventType: eventType
            }
        };
        await sender.sendMessages(message);
        console.log(`Published event ${eventType} to Service Bus.`);
    } catch (err) {
        console.error(`Failed to publish event ${eventType}: `, err);
    }
}

module.exports = {
    publishEvent
};
