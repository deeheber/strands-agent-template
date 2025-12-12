"""Tests for the agent."""

from src.agentcore_app import get_agent


def test_agent_has_tools() -> None:
    """Test agent has expected tools registered."""
    agent = get_agent()
    tool_names = agent.tool_names
    assert "calculator" in tool_names
    assert "current_time" in tool_names
    assert "letter_counter" in tool_names
