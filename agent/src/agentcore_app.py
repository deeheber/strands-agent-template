"""AgentCore Runtime wrapper for the Strands agent."""

import logging
import os
from typing import Any

from bedrock_agentcore.runtime import BedrockAgentCoreApp
from strands import Agent
from strands_tools import calculator, current_time  # type: ignore[import-untyped]

from tools import letter_counter

log_level = os.getenv("LOG_LEVEL", "INFO").upper()

logging.basicConfig(
    level=getattr(logging, log_level),
    format="%(levelname)s | %(name)s | %(message)s",
    handlers=[logging.StreamHandler()],
)

logging.getLogger("strands").setLevel(log_level)

app = BedrockAgentCoreApp()


def get_agent() -> Agent:
    """Create and return a Strands agent with configured tools."""
    return Agent(tools=[calculator, current_time, letter_counter])


@app.entrypoint
async def invoke(payload: dict[str, Any] | None = None) -> dict[str, Any]:
    """Main entrypoint for the agent invocation."""
    try:
        prompt = payload.get("prompt", "Hello!") if payload else "Hello!"

        logging.info(f"AgentCore invocation started with prompt: {prompt}")
        logging.info(f"Payload received: {payload}")

        agent = get_agent()
        logging.info(
            "Agent created successfully with tools: calculator, current_time, letter_counter"
        )

        logging.info("Starting agent execution...")
        response = agent(prompt)
        response_text = response.message["content"][0]["text"]

        logging.info(f"Agent response generated successfully (length: {len(response_text)} chars)")
        logging.info(f"Agent response preview: {response_text[:200]}...")

        result = {"status": "success", "response": response_text}
        logging.info("AgentCore invocation completed successfully")

        return result

    except Exception as e:
        logging.error(f"Error processing request: {e}", exc_info=True)
        logging.error(f"Payload that caused error: {payload}")
        return {"status": "error", "error": "Internal processing error"}


if __name__ == "__main__":
    app.run()
