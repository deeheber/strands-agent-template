# Build stage
FROM public.ecr.aws/docker/library/python:3.13-slim AS builder

WORKDIR /build

# Copy project configuration and install dependencies
# README.md is required by hatchling build system (referenced in pyproject.toml)
COPY pyproject.toml README.md ./
RUN pip install --no-cache-dir .

# Runtime stage
FROM public.ecr.aws/docker/library/python:3.13-slim

WORKDIR /app

# Copy installed dependencies from builder to system location
COPY --from=builder /usr/local/lib/python3.13/site-packages /usr/local/lib/python3.13/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Set environment variables
# AWS_REGION and AWS_DEFAULT_REGION are set by CDK at runtime
ENV LOG_LEVEL=INFO
ENV PYTHONPATH=/app

# Create non-root user for security
RUN useradd -m -u 1000 bedrock_agentcore

# Copy application code
COPY --chown=bedrock_agentcore:bedrock_agentcore src/ .

# Switch to non-root user
USER bedrock_agentcore

# Expose ports
EXPOSE 8080
EXPOSE 8000

# Run the agent
CMD ["python", "agentcore_app.py"]
