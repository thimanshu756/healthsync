import os
import asyncio
import uvicorn
from fastapi import FastAPI
from azure.servicebus.aio import ServiceBusClient
from dotenv import load_dotenv

load_dotenv()

CONNECTION_STR = os.getenv("SERVICEBUS_CONNECTION_STRING")
EMAIL_QUEUE = "notifications-email"
SMS_QUEUE = "notifications-sms"
PORT = int(os.getenv("PORT", 8080))

# FastAPI app for health endpoint
http_app = FastAPI(title="Notification Service")


@http_app.get("/health")
def health_check():
    return {"status": "Healthy", "service": "notification-service"}


@http_app.get("/")
def root():
    return {"service": "notification-service", "status": "running"}


async def process_message(msg):
    # Simulated email/SMS sending
    print(f"Received message: {str(msg)}")
    print(f"Properties: {msg.application_properties}")
    print("Mock Notification Sent Successfully!")


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


async def run_worker():
    if not CONNECTION_STR:
        print("SERVICEBUS_CONNECTION_STRING not set. Worker will not start.")
        return

    print("Starting Notification Worker...")
    await asyncio.gather(
        listen_to_queue(EMAIL_QUEUE),
        listen_to_queue(SMS_QUEUE)
    )


async def run_http_server():
    """Run the FastAPI health server using uvicorn."""
    config = uvicorn.Config(http_app, host="0.0.0.0", port=PORT, log_level="info")
    server = uvicorn.Server(config)
    await server.serve()


async def main():
    """Run both the HTTP health server and the Service Bus worker concurrently."""
    print(f"Starting Notification Service on port {PORT}...")
    await asyncio.gather(
        run_http_server(),
        run_worker(),
    )


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("Shutting down notification service.")
