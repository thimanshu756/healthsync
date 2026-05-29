import os
import asyncio
from azure.servicebus.aio import ServiceBusClient
from dotenv import load_dotenv

load_dotenv()

CONNECTION_STR = os.getenv("SERVICEBUS_CONNECTION_STRING")
TOPIC_NAME = os.getenv("SERVICEBUS_TOPIC_NAME", "domain-events")
SUBSCRIPTION_NAME = os.getenv("SERVICEBUS_SUBSCRIPTION_NAME", "notifications-sub")

async def process_message(msg):
    # Simulated email sending
    print(f"Received message: {str(msg)}")
    print(f"Properties: {msg.application_properties}")
    print("Mock Email Sent Successfully!")

async def listen_for_events():
    if not CONNECTION_STR:
        print("SERVICEBUS_CONNECTION_STRING not set. Exiting.")
        return

    while True:
        try:
            async with ServiceBusClient.from_connection_string(conn_str=CONNECTION_STR) as client:
                print(f"Listening to Topic: {TOPIC_NAME}, Subscription: {SUBSCRIPTION_NAME}")
                receiver = client.get_subscription_receiver(topic_name=TOPIC_NAME, subscription_name=SUBSCRIPTION_NAME)
                async with receiver:
                    async for msg in receiver:
                        await process_message(msg)
                        await receiver.complete_message(msg)
        except Exception as e:
            print(f"Error occurred: {e}. Reconnecting in 5 seconds...")
            await asyncio.sleep(5)

if __name__ == "__main__":
    try:
        asyncio.run(listen_for_events())
    except KeyboardInterrupt:
        print("Shutting down notification service.")
