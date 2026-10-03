FROM public.ecr.aws/docker/library/python:3.14-slim

# TODO: multi-stage build to drop uv binaries from final image
COPY --from=ghcr.io/astral-sh/uv:0.12 /uv /uvx /bin/

WORKDIR /app

ENV UV_COMPILE_BYTECODE=1
ENV UV_LINK_MODE=copy

COPY pyproject.toml uv.lock ./
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --locked --no-dev --no-install-project && \
    useradd -m -u 1000 appuser && \
    chown -R appuser:appuser /app

COPY --chown=appuser:appuser src/ .

ENV PATH="/app/.venv/bin:$PATH"

USER appuser

ENV LOG_LEVEL=INFO

EXPOSE 8080 8000

CMD ["opentelemetry-instrument", "python", "agentcore_app.py"]
