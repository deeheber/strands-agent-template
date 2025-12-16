---
inclusion: fileMatch
fileMatchPattern: "agent/**"
---

# Python Standards

## Configuration

**Python**: 3.13, pyproject.toml, 100 char line length
**Style**: Strict typing, Google docstrings, `strands_tools` imports
**Tools**: MyPy strict mode, Ruff (E,F,I,N,W,UP), Black, Pytest

## Structure

**Main**: `agentcore_app.py` (BedrockAgentCoreApp + @app.entrypoint)
**Tools**: `tools/custom_tools.py` (@tool decorator), export in `__init__.py`

## Patterns

**Agent**: `Agent(tools=[calculator, current_time, http_request, custom_tool])`
**Tool**: `@tool` decorator with Google docstrings (Args, Returns, Raises)
**Error**: Return `{"status": "success/error", "response/error": "..."}` pattern

## Commands

**Quality**: `./quality-check.sh` (all checks with auto-fix)
**Manual**: `pytest && mypy src/ && ruff check --fix . && black .`

## Testing

**Agent**: `assert "tool_name" in get_agent().tool_names`
**Functions**: Type hints required, descriptive docstrings

## Environment

**LOG_LEVEL**: INFO (default), DEBUG, ERROR
**AWS regions**: Auto-set by AgentCore Runtime
