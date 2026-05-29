import pytest
from fastapi.testclient import TestClient
from src.main import app, process_message

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "Healthy"}

def test_get_insights_empty():
    response = client.get("/insights")
    assert response.status_code == 200
    assert "data" in response.json()

@pytest.mark.asyncio
async def test_process_message_adds_to_recent():
    await process_message("Test Event")
    response = client.get("/insights")
    data = response.json()["data"]
    assert data["recent_events_processed"] > 0
