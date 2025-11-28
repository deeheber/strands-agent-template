# Project Structure

## Repository Layout

```
strands-agent/
├── agent/              # Python agent implementation
│   ├── src/           # Source code
│   ├── tests/         # Test files
│   ├── .venv/         # Virtual environment (gitignored)
│   ├── .env.example   # Environment variable template
│   ├── pyproject.toml # Project config & dependencies
│   └── README.md      # Agent-specific documentation
├── .github/
│   └── workflows/     # GitHub Actions CI/CD pipelines
├── .kiro/             # Kiro IDE configuration
│   └── steering/      # AI assistant guidance documents
└── README.md          # Root documentation
```

## Agent Directory (`agent/`)

### Source Code (`src/`)

- `agent.py` - Main agent implementation
- `__init__.py` - Package initialization

### Tests (`tests/`)

- `test_agent.py` - Agent test suite
- Test files should mirror source structure

### Configuration Files

- `pyproject.toml` - Single source of truth for dependencies, build config, and tool settings
- `.python-version` - Python version specification (3.13)
- `.env.example` - Template for environment variables (copy to `.env` for local config)

## Code Organization Patterns

### Agent Definition

- Agents are created using the `Agent` class from `strands`
- Tools are registered via the `tools` parameter
- Custom tools use the `@tool` decorator
- Agent execution should be wrapped in `if __name__ == "__main__":` to prevent running during imports

### Tool Implementation

- Custom tools are Python functions decorated with `@tool`
- Include comprehensive docstrings with Args and Returns sections
- Type hints are required (enforced by mypy strict mode)
- Input validation should be explicit

### Logging

- Use Python's `logging` module
- Log level configurable via `LOG_LEVEL` environment variable
- Default level: INFO
- Format: `%(levelname)s | %(name)s | %(message)s`

## CI/CD

- GitHub Actions workflows in `.github/workflows/`
- Automated testing, type checking, linting, and formatting on push/PR
- Runs on Python 3.13 with all dev dependencies

## Future Structure

The repository will expand to include:

- `cdk/` - TypeScript CDK infrastructure for deployment
