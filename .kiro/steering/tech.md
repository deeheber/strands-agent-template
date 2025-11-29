# Technology Stack

## Language & Runtime

- **Python 3.13** (strict requirement, specified in `.python-version`)
- Virtual environment managed with `venv`

## Core Dependencies

- `strands-agents` (>=0.2.0) - Main agent framework
- `strands-agents-tools` (>=0.2.0) - Community tools library
- `bedrock-agentcore` (>=0.1.0) - AgentCore Runtime SDK
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

### Run Agent Locally

```bash
python src/agentcore_app.py

# In another terminal
curl -X POST http://localhost:8080/invocations \
  -H "Content-Type: application/json" \
  -d '{"prompt": "What is 42 * 137?"}'
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

## AWS Deployment

### Prerequisites

- Docker installed and running (for building container images)
- AWS CLI configured with credentials
- Bedrock model access enabled in your chosen region

**Region Configuration**: The region is automatically determined from your AWS CLI configuration. To set or change your region:

```bash
aws configure set region <your-region>
```

Common regions with Bedrock AgentCore support: us-west-2, us-east-1

### Deploy to AgentCore Runtime

**Important**: Ensure Docker is running before deployment (required for building the container image).

```bash
# Verify Docker is running
docker ps

cd cdk
npm install
npm run build
cdk deploy
```

See `DEPLOYMENT.md` for complete deployment instructions.

## CDK Development

### Import Best Practices

**Avoid wildcard imports from aws-cdk-lib:**

```typescript
// ❌ Don't do this
import * as cdk from "aws-cdk-lib";

// ✅ Do this instead
import { Stack, StackProps, Duration } from "aws-cdk-lib";
import { Function, Runtime, Code } from "aws-cdk-lib/aws-lambda";
import { Bucket } from "aws-cdk-lib/aws-s3";
```

**Benefits:**

- Explicit dependencies make code more maintainable
- Better IDE autocomplete and type checking
- Easier to identify which CDK constructs are actually used
- Reduces namespace pollution

### CDK Commands

```bash
cd cdk
npm install                 # Install dependencies
npm run build              # Compile TypeScript
npm test                   # Run Jest tests
npm run lint               # Run ESLint
npm run format             # Run Prettier
cdk synth                  # Synthesize CloudFormation
cdk deploy                 # Deploy stack
```

## CI/CD

### Agent CI

- **GitHub Actions** - `.github/workflows/agent-ci.yml`
- Runs on every push/PR to main branch
- Validates: pytest, mypy, ruff, black
- Uses Python 3.13 on Ubuntu with pip caching

### CDK CI

- **GitHub Actions** - `.github/workflows/cdk-ci.yml`
- Runs on every push/PR to main branch
- Validates: TypeScript compilation, Jest tests, ESLint, Prettier
- Uses Node.js 24 (from `.nvmrc`) on Ubuntu with npm caching
