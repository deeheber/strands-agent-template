"""Main agent implementation."""

from strands import Agent


def create_agent() -> Agent:
    """Create and configure the Strands agent."""
    agent = Agent(
        name="my-agent",
        system_prompt="You are a helpful AI assistant.",
    )

    return agent
