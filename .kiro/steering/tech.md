# Technology Stack

## Language & Runtime

- **Python 3.13** (strict requirement, specified in `.python-version`)
- Virtual environment managed with `venv`

## Core Dependencies

- `strands-agents` (>=0.2.0) - Main agent framework
- `strands-agents-tools` (>=0.2.0) - Community tools library
- `strands-agents-builder` (>=0.1.10, dev only) - Development utilities

## Development Tools

- **pytest** (>=9.0.0) - Testing framework with async support
- **mypy** (>=1.18.0) - Static type checker (strict mode enabled)
- **ruff** (>=0.14.0) - Fast Python linter
- **black** (>=25.11.0) - Code formatter

## Build System

- **hatchling** - Modern Python build backend
- Package name: `strands-agent`

## Common Commands

### Setup

```bash
cd agent
python3.13 -m venv .venv
source .venv/bin/activate  # macOS/Linux
pip install -e ".[dev]"
cp .env.example .env        # Optional: configure environment variables
```

### Run Agent

```bash
python src/agent.py
```

### Testing & Quality

```bash
pytest                      # Run tests
mypy src/                   # Type check
ruff check .                # Lint
ruff check --fix .          # Auto-fix linting
black .                     # Format code
black --check .             # Check formatting
```

### Full Validation

```bash
pytest && mypy src/ && ruff check . && black --check .
```

## Configuration

All tool configurations are centralized in `agent/pyproject.toml`:

- Line length: 100 characters (black, ruff)
- Target: Python 3.13
- Mypy: Strict mode with full type checking
- Pytest: Auto async mode

## CI/CD

- **GitHub Actions** - Automated testing pipeline
- Runs on every push/PR to main and develop branches
- Validates: pytest, mypy, ruff, black
- Uses Python 3.13 on Ubuntu with pip caching
