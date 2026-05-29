import os
import asyncio
from azure.servicebus.aio import ServiceBusClient
from dotenv import load_dotenv

load_dotenv()

CONNECTION_STR = os.getenv("SERVICEBUS_CONNECTION_STRING")
EMAIL_QUEUE = "notifications-email"
SMS_QUEUE = "notifications-sms"

async def process_message(msg):
    # Simulated email sending
    print(f"Received message: {str(msg)}")
    print(f"Properties: {msg.application_properties}")
    print("Mock Email Sent Successfully!")

async def listen_to_queue(queue_name):
    while True:
        try:
            async with ServiceBusClient.from_connection_string(conn_str=CONNECTION_STR) as client:
                print(f"Listening to Queue: {queue_name}")
                receiver = client.get_queue_receiver(queue_name=queue_name)
                async with receiver:
                    async for msg in receiver:
                        await process_message(msg)
                        await receiver.complete_message(msg)
        except Exception as e:
            print(f"Error occurred in {queue_name}: {e}. Reconnecting in 5 seconds...")
            await asyncio.sleep(5)

async def main():
    if not CONNECTION_STR:
        print("SERVICEBUS_CONNECTION_STRING not set. Exiting.")
        return
    
    print("Starting Notification Worker...")
    await asyncio.gather(
        listen_to_queue(EMAIL_QUEUE),
        listen_to_queue(SMS_QUEUE)
    )

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("Shutting down notification service.")
