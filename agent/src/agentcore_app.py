"""AgentCore Runtime wrapper for the Strands agent."""

import logging
import os
from typing import Any

from bedrock_agentcore.runtime import BedrockAgentCoreApp
from strands import Agent
from strands_tools import calculator, current_time  # type: ignore[import-untyped]

from tools import letter_counter

# Configure observability for AgentCore environment
def _setup_observability() -> None:
    """
    Configure ADOT observability when running in AgentCore environment.
    
    This function automatically detects AgentCore deployment environment by checking
    for specific environment variables and enables OpenTelemetry instrumentation only
    when deployed to AWS Bedrock AgentCore Runtime.
    
    Environment Detection:
    - BEDROCK_AGENTCORE_RUNTIME_ID: AgentCore runtime identifier
    - BEDROCK_AGENTCORE_APPLICATION_ID: AgentCore application identifier  
    - BEDROCK_AGENTCORE_AGENT_ID: AgentCore agent identifier
    - AWS_LAMBDA_FUNCTION_NAME: AWS Lambda function name (if applicable)
    
    When AgentCore environment is detected, configures:
    - OpenTelemetry auto-instrumentation via AWS Distro for OpenTelemetry (ADOT)
    - Service naming for AgentCore observability dashboard
    - Resource attributes with AgentCore metadata
    - OTLP exporters for traces, metrics, and logs
    
    Local development remains unaffected - observability only activates in AgentCore.
    """
    # Only activate observability if AgentCore environment variables are present
    agentcore_indicators = [
        "BEDROCK_AGENTCORE_RUNTIME_ID",
        "BEDROCK_AGENTCORE_APPLICATION_ID", 
        "BEDROCK_AGENTCORE_AGENT_ID",
        "AWS_LAMBDA_FUNCTION_NAME"
    ]
    
    # Check if we're running in AgentCore environment
    is_agentcore_env = any(os.getenv(var) for var in agentcore_indicators)
    
    if is_agentcore_env:
        try:
            from aws_opentelemetry_distro.auto_instrumentation import AwsOpenTelemetryDistro
            
            # Configure service name for AgentCore observability
            service_name = os.getenv("OTEL_SERVICE_NAME", "strands-agent")
            
            # Set OpenTelemetry resource attributes for AgentCore
            resource_attributes = [
                f"service.name={service_name}",
                "service.version=0.1.0",
            ]
            
            # Add AgentCore specific attributes if available
            if runtime_id := os.getenv("BEDROCK_AGENTCORE_RUNTIME_ID"):
                resource_attributes.append(f"bedrock.agentcore.runtime.id={runtime_id}")
            if app_id := os.getenv("BEDROCK_AGENTCORE_APPLICATION_ID"):
                resource_attributes.append(f"bedrock.agentcore.application.id={app_id}")
            if agent_id := os.getenv("BEDROCK_AGENTCORE_AGENT_ID"):
                resource_attributes.append(f"bedrock.agentcore.agent.id={agent_id}")
                
            # Set environment variables for ADOT auto-instrumentation
            os.environ.setdefault("OTEL_SERVICE_NAME", service_name)
            os.environ.setdefault("OTEL_RESOURCE_ATTRIBUTES", ",".join(resource_attributes))
            os.environ.setdefault("OTEL_LOGS_EXPORTER", "otlp")
            os.environ.setdefault("OTEL_METRICS_EXPORTER", "otlp")
            os.environ.setdefault("OTEL_TRACES_EXPORTER", "otlp")
            
            # Initialize auto-instrumentation
            AwsOpenTelemetryDistro().instrument()
            
            logging.info(f"AgentCore observability initialized for service: {service_name}")
            
        except ImportError:
            logging.warning("ADOT not available - observability disabled")
        except Exception as e:
            logging.warning(f"Failed to initialize observability: {e}")
    else:
        logging.info("Not running in AgentCore environment - observability disabled")

# Initialize observability at module level
_setup_observability()

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
