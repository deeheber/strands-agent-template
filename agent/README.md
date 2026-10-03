# Strands Agent

Python 3.14 agent with calculator, current-time, and letter-counter tools. Local runs call Bedrock using your AWS credentials.

## Run Locally

From this directory, with uv 0.12 installed:

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
  -d '{"prompt":"Use calculator to calculate 42 * 137."}'
```

Expect `status: "success"` and 5,754 in the response.

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

The included calculator is deprecated upstream but still works with the locked dependencies.

## Development

```bash
uv run --locked pytest
uv run --locked mypy src/
uv run --locked ruff check .
uv run --locked black --check .
```

`./quality-check.sh` applies lint fixes and formatting. See [DEPLOYMENT.md](../DEPLOYMENT.md) to deploy.
