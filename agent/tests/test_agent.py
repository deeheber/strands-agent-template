"""Tests for the agent."""

import asyncio
import json
import logging
import os
import subprocess
import sys
from unittest.mock import patch

import pytest
from strands.agent.agent_result import AgentResult
from strands.telemetry.metrics import EventLoopMetrics

from src.agentcore_app import DEFAULT_MODEL_ID, get_agent, get_model_id, invoke


def test_agent_has_tools() -> None:
    """Test agent has expected tools registered."""
    agent = get_agent()
    tool_names = agent.tool_names
    assert "calculator" in tool_names
    assert "current_time" in tool_names
    assert "letter_counter" in tool_names


def test_get_model_id_fallback() -> None:
    """Test get_model_id returns the default when environment variable is not set."""
    with patch.dict(os.environ, {}, clear=True):
        model_id = get_model_id()
        assert model_id == DEFAULT_MODEL_ID


def test_invoke_handles_reasoning_before_multiple_text_blocks() -> None:
    response = AgentResult(
        stop_reason="end_turn",
        message={
            "role": "assistant",
            "content": [
                {"reasoningContent": {"reasoningText": {"text": "Thinking", "signature": "test"}}},
                {"text": "First part."},
                {"text": "Second part."},
            ],
        },
        metrics=EventLoopMetrics(),
        state={},
    )
    with patch("src.agentcore_app.get_agent") as factory:
        factory.return_value.return_value = response
        result = asyncio.run(invoke({"prompt": "Test prompt"}))

    factory.return_value.assert_called_once_with("Test prompt")
    assert result == {"status": "success", "response": "First part.\nSecond part.\n"}


def test_invoke_returns_generic_error_on_model_failure() -> None:
    with patch("src.agentcore_app.get_agent") as factory:
        factory.return_value.side_effect = RuntimeError("Private provider details")
        result = asyncio.run(invoke({"prompt": "Test prompt"}))

    assert result == {"status": "error", "error": "Internal processing error"}


@pytest.mark.parametrize(
    "configured,expected", [("invalid", logging.INFO), (" debug ", logging.DEBUG)]
)
def test_log_level_is_normalized_for_root_and_strands(configured: str, expected: int) -> None:
    result = subprocess.run(
        [
            sys.executable,
            "-c",
            "import json, logging; import src.agentcore_app; "
            "print(json.dumps([logging.getLogger().level, logging.getLogger('strands').level]))",
        ],
        env={**os.environ, "LOG_LEVEL": configured, "PYTHONPATH": "src"},
        capture_output=True,
        text=True,
        check=True,
    )
    assert json.loads(result.stdout) == [expected, expected]
