"""Tests for the agent."""

from src.agent import create_agent


def test_create_agent():
    """Test agent creation."""
    agent = create_agent()
    assert agent is not None
    assert agent.name == "my-agent"
