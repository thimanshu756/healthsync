const { ServiceBusClient } = require("@azure/service-bus");
const { logger } = require("./db");
require("dotenv").config();

let sbClient = null;
let sender = null;
const topicName = process.env.SERVICEBUS_TOPIC_NAME || "domain-events";

if (process.env.SERVICEBUS_CONNECTION_STRING) {
  try {
    sbClient = new ServiceBusClient(process.env.SERVICEBUS_CONNECTION_STRING);
    sender = sbClient.createSender(topicName);
    logger.info(`Connected to Service Bus Topic: ${topicName}`);
  } catch (err) {
    logger.error("Failed to connect to Service Bus: ", err);
  }
} else {
  logger.warn(
    "SERVICEBUS_CONNECTION_STRING is not set. Event publishing is disabled."
  );
}

const publishEvent = async (eventType, payload) => {
  if (!sender) {
    logger.warn(`Cannot publish ${eventType} - Service Bus not configured.`);
    return;
  }
  try {
    const message = {
      body: payload,
      applicationProperties: {
        eventType: eventType,
      },
    };
    await sender.sendMessages(message);
    logger.info(`Published event ${eventType} to ${topicName}`);
  } catch (err) {
    logger.error(`Error publishing event ${eventType}: `, err);
  }
};

module.exports = {
  publishEvent,
};
