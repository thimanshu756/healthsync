import pytest
import asyncio
from unittest.mock import AsyncMock, patch, MagicMock

# Import the module after mocking the environment
import src.main as main

@pytest.mark.asyncio
async def test_process_message(capsys):
    # Create a mock Service Bus Message
    mock_msg = MagicMock()
    mock_msg.__str__.return_value = "Test Message Body"
    mock_msg.application_properties = {"eventType": "AppointmentCreated"}
    
    # Call process_message
    await main.process_message(mock_msg)
    
    # Capture output
    captured = capsys.readouterr()
    assert "Received message: Test Message Body" in captured.out
    assert "Mock Email Sent Successfully!" in captured.out

@pytest.mark.asyncio
@patch('src.main.ServiceBusClient')
async def test_listen_for_events_no_connection_string(mock_sb_client, capsys):
    # Set connection string to None
    main.CONNECTION_STR = None
    
    await main.listen_for_events()
    
    captured = capsys.readouterr()
    assert "SERVICEBUS_CONNECTION_STRING not set. Exiting." in captured.out
    mock_sb_client.assert_not_called()
