import os
import asyncio
from fastapi import FastAPI, BackgroundTasks
from azure.servicebus.aio import ServiceBusClient
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="AI Insights Service")

CONNECTION_STR = os.getenv("SERVICEBUS_CONNECTION_STRING")
TOPIC_NAME = os.getenv("SERVICEBUS_TOPIC_NAME", "domain-events")
SUBSCRIPTION_NAME = os.getenv("SERVICEBUS_SUBSCRIPTION_NAME", "analytics-sub")

# In-memory store for recent insights
recent_events = []

async def process_message(msg):
    # Simulated insight processing
    print(f"Processing analytics event: {str(msg)}")
    recent_events.append({"event": str(msg), "timestamp": "now"})
    if len(recent_events) > 50:
        recent_events.pop(0)

async def listen_for_events():
    if not CONNECTION_STR:
        print("SERVICEBUS_CONNECTION_STRING not set. Worker will not start.")
        return

    while True:
        try:
            async with ServiceBusClient.from_connection_string(conn_str=CONNECTION_STR) as client:
                print(f"Analytics Worker listening to Topic: {TOPIC_NAME}, Subscription: {SUBSCRIPTION_NAME}")
                receiver = client.get_subscription_receiver(topic_name=TOPIC_NAME, subscription_name=SUBSCRIPTION_NAME)
                async with receiver:
                    async for msg in receiver:
                        await process_message(msg)
                        await receiver.complete_message(msg)
        except Exception as e:
            print(f"Error occurred in worker: {e}. Reconnecting in 5 seconds...")
            await asyncio.sleep(5)

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(listen_for_events())

@app.get("/health")
def health_check():
    return {"status": "Healthy"}

@app.get("/insights")
def get_insights():
    # Return mock AI Insights based on collected events
    return {
        "status": "success",
        "data": {
            "predicted_no_shows": 12,
            "average_wait_time_mins": 14,
            "recent_events_processed": len(recent_events)
        }
    }
