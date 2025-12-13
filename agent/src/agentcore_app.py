"""AgentCore Runtime wrapper for the Strands agent."""

import logging
import os
from typing import Any

# Initialize OpenTelemetry only when running in AgentCore (not local development)
# Check for AgentCore environment indicators
is_agentcore = bool(
    os.getenv("AWS_EXECUTION_ENV") or 
    os.getenv("AWS_LAMBDA_FUNCTION_NAME") or 
    os.getenv("BEDROCK_AGENTCORE_RUNTIME_ID")
)

if is_agentcore:
    from aws_opentelemetry_distro.auto_instrumentation import AwsOpenTelemetryDistro
    # Initialize OTEL auto-instrumentation only in AgentCore
    AwsOpenTelemetryDistro().instrument()

from opentelemetry import trace
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

# Get tracer for custom spans (only if telemetry is enabled)
tracer = trace.get_tracer(__name__) if is_agentcore else None


def get_agent() -> Agent:
    """Create and return a Strands agent with configured tools."""
    if tracer:
        with tracer.start_as_current_span("get_agent") as span:
            span.set_attribute("agent.tools_count", 3)
            span.set_attribute("agent.tools", "calculator,current_time,letter_counter")
            return Agent(tools=[calculator, current_time, letter_counter])
    else:
        return Agent(tools=[calculator, current_time, letter_counter])


@app.entrypoint
async def invoke(payload: dict[str, Any] | None = None) -> dict[str, Any]:
    """Main entrypoint for the agent invocation."""
    if tracer:
        with tracer.start_as_current_span("agent_invoke") as span:
            return await _invoke_with_telemetry(payload, span)
    else:
        return await _invoke_without_telemetry(payload)


async def _invoke_with_telemetry(payload: dict[str, Any] | None, span: Any) -> dict[str, Any]:
    """Agent invocation with telemetry enabled."""
    try:
        prompt = payload.get("prompt", "Hello!") if payload else "Hello!"
        
        # Add trace attributes
        span.set_attribute("agent.prompt_length", len(prompt))
        span.set_attribute("agent.prompt", prompt[:100])  # Truncate for safety
        
        logging.info(f"Received prompt: {prompt}")

        with tracer.start_as_current_span("agent_creation"):  # type: ignore
            agent = get_agent()
        
        with tracer.start_as_current_span("agent_execution") as exec_span:  # type: ignore
            exec_span.set_attribute("agent.input", prompt)
            response = agent(prompt)
            response_text = response.message["content"][0]["text"]
            exec_span.set_attribute("agent.output_length", len(response_text))

        logging.info(f"Agent response: {response_text}")
        
        # Set success attributes
        span.set_attribute("agent.status", "success")
        span.set_attribute("agent.response_length", len(response_text))

        return {"status": "success", "response": response_text}

    except Exception as e:
        logging.error(f"Error processing request: {e}", exc_info=True)
        
        # Set error attributes
        span.set_attribute("agent.status", "error")
        span.set_attribute("agent.error_type", type(e).__name__)
        span.set_attribute("agent.error_message", str(e))
        span.record_exception(e)
        
        return {"status": "error", "error": "Internal processing error"}


async def _invoke_without_telemetry(payload: dict[str, Any] | None) -> dict[str, Any]:
    """Agent invocation without telemetry (for local development)."""
    try:
        prompt = payload.get("prompt", "Hello!") if payload else "Hello!"
        logging.info(f"Received prompt: {prompt}")

        agent = get_agent()
        response = agent(prompt)
        response_text = response.message["content"][0]["text"]

        logging.info(f"Agent response: {response_text}")
        return {"status": "success", "response": response_text}

    except Exception as e:
        logging.error(f"Error processing request: {e}", exc_info=True)
        return {"status": "error", "error": "Internal processing error"}


if __name__ == "__main__":
    app.run()
