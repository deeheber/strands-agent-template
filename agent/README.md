# Strands Agent

A Strands AI agent built with Python 3.13.

## Quick Start

```bash
# Setup
python3.13 -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"

# Run locally
python src/agentcore_app.py

# Test
curl -X POST http://localhost:8080/invocations \
  -H "Content-Type: application/json" \
  -d '{"prompt": "What is 42 * 137?"}'
```

## Project Structure

```
agent/
├── src/
│   ├── agentcore_app.py       # Agent implementation
│   └── tools/                 # Custom tools
├── tests/                     # Test files
├── pyproject.toml             # Dependencies & config
├── quality-check.sh           # Run all quality checks
└── Dockerfile                 # Container for deployment
```

## Adding Tools

### Community Tools

```python
# Import from strands_tools
from strands_tools import calculator, current_time, http_request, file_read

# Add to agent
def create_agent() -> Agent:
    return Agent(tools=[calculator, current_time, http_request, file_read])
```

Available: `http_request`, `file_read`, `file_write`, `editor`, `shell`, `python_repl`, `browser`, etc.

### Custom Tools

**Add to existing file** (`src/tools/custom_tools.py`) or **create new file** (`src/tools/my_tools.py`):

```python
from strands import tool

@tool
def my_tool(param: str) -> str:
    """Tool description."""
    return f"Result: {param}"
```

**Export in** `src/tools/__init__.py`:

```python
from .custom_tools import letter_counter, my_tool
__all__ = ["letter_counter", "my_tool"]
```

**Import in agent**:

```python
from tools import letter_counter, my_tool
```

## Usage

**Local Testing:**

```bash
python src/agentcore_app.py
```

**Cloud Deployment:** See [DEPLOYMENT.md](../DEPLOYMENT.md)

**Environment Variables:**

- `LOG_LEVEL` - Logging level (default: `INFO`)

## Testing

```bash
pytest                      # Run all tests
pytest -v                   # Verbose output
pytest --cov=src           # Coverage report
```

## Development

**Quality Checks:**

```bash
./quality-check.sh          # All checks with auto-fixing (recommended)
pytest                      # Tests only
mypy src/                   # Type check
ruff check --fix .          # Lint with auto-fix
black .                     # Format
```

**Configuration:** All settings in `pyproject.toml`
