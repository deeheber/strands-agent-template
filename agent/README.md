# Strands Agent

Python 3.15 agent with unit-converter, Python REPL, and letter-counter tools. Local runs call Bedrock using your AWS credentials.

## Run Locally

With uv 0.13.7 installed, run from this directory:

```bash
export AWS_REGION=us-west-2
export AWS_DEFAULT_REGION=us-west-2
uv sync --locked
uv run python src/agentcore_app.py
```

In another terminal:

```bash
curl -sS http://localhost:8080/invocations \
  -H 'Content-Type: application/json' \
  -d '{"prompt":"Use unit_converter to convert 100 c to f."}'
```

Expect `status: "success"` and 212 in the response.

## Configuration

Optionally copy `.env.example` to `.env`, edit the model or local log level, and run:

```bash
uv run --env-file .env python src/agentcore_app.py
```

CDK reads this same file. See [deployment configuration](../DEPLOYMENT.md#configuration) for defaults and precedence.

## Adding Tools

Add a tool in `src/tools/`, following `custom_tools.py`:

```python
from strands import tool


@tool
def greet(name: str) -> str:
    """Greet someone by name."""
    return f"Hello, {name}!"
```

Export it from `src/tools/__init__.py`, import it in `src/agentcore_app.py`, and add it to the `tools` list in `get_agent()`. Remove any demo tools you do not need, and test your tool in `tests/test_tools/`.

The custom `unit_converter` supports `c`/`f`, `km`/`mi`, and `kg`/`lb`.

The SDK `python_repl` runs each call in a fresh interpreter. Code has the agent process's filesystem, network, and AWS permissions, locally or in the deployed AgentCore session. It adds no isolation.

Ask `Use python_repl to print 42 * 137.` and expect 5754.

## Development

```bash
uv run --locked pytest
uv run --locked mypy src/
uv run --locked ruff check .
uv run --locked ruff format --check .
```

`./quality-check.sh` applies lint fixes and formatting. See [DEPLOYMENT.md](../DEPLOYMENT.md) to deploy.
