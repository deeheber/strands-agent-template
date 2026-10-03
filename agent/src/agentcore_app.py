"""AgentCore Runtime wrapper for the Strands agent."""

import logging
import os
from typing import Any

from bedrock_agentcore.runtime import BedrockAgentCoreApp
from strands import Agent
from strands_tools import calculator, current_time

from tools import letter_counter

DEFAULT_MODEL_ID = "us.anthropic.claude-sonnet-4-6"
log_level = logging.getLevelNamesMapping().get(
    os.getenv("LOG_LEVEL", "INFO").strip().upper(), logging.INFO
)

logging.basicConfig(
    level=log_level,
    format="%(levelname)s | %(name)s | %(message)s",
    handlers=[logging.StreamHandler()],
)

logging.getLogger("strands").setLevel(log_level)
logger = logging.getLogger(__name__)

app = BedrockAgentCoreApp()


def get_model_id() -> str:
    """
    Get the Bedrock model ID from environment variable or use default.

    Returns:
        str: The model ID to use for the agent
    """
    model_id = os.getenv("BEDROCK_MODEL_ID", "").strip() or DEFAULT_MODEL_ID
    logger.info("Using Bedrock model: %s", model_id)
    return model_id


def get_agent() -> Agent:
    """Create and return a Strands agent with configured tools and model."""
    model_id = get_model_id()
    return Agent(model=model_id, tools=[calculator, current_time, letter_counter])


@app.entrypoint
async def invoke(payload: dict[str, Any] | None = None) -> dict[str, Any]:
    """Main entrypoint for the agent invocation."""
    try:
        prompt = payload.get("prompt", "Hello!") if payload else "Hello!"

        logger.info("AgentCore invocation started")

        agent = get_agent()
        response = agent(prompt)
        response_text = str(response)

        logger.info("Agent response generated (length: %s chars)", len(response_text))

        result = {"status": "success", "response": response_text}
        logger.info("AgentCore invocation completed successfully")

        return result

    except Exception:
        logger.exception("Error processing request")
        return {"status": "error", "error": "Internal processing error"}


if __name__ == "__main__":
    app.run()
