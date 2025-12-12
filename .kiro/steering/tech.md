# Technology Stack

## Core Stack

- **Python 3.13** (`.python-version`)
- **Node.js 24** (`.nvmrc`) - For CDK development
- **strands-agents** (>=0.2.0) - Agent framework
- **strands-agents-tools** (>=0.2.0) - Community tools
- **bedrock-agentcore** (>=0.1.0) - AgentCore SDK
- **pytest, mypy, ruff, black** - Quality assurance tools

## Community Tools

Available from `strands_tools`: `file_read`, `file_write`, `http_request`, `browser`, `python_repl`, `shell`, `calculator`, `current_time`, `generate_image`, etc.

```python
from strands_tools import calculator, current_time, http_request
```

## Commands

**Setup:**

```bash
cd agent
python3.13 -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"
```

**Development:**

```bash
python src/agentcore_app.py     # Run locally
./quality-check.sh              # All quality checks
pytest && mypy src/ && ruff check . && black --check .  # Manual validation
```

**Configuration:** All settings in `agent/pyproject.toml` (line length: 100, Python 3.13, strict mode)

## AWS Deployment

**Prerequisites:** Docker running, AWS CLI configured, Bedrock access

**Deploy:**

```bash
cd cdk && npm install && npm run build && cdk deploy
```

**Regions:** us-west-2, us-east-1 (auto-detected from AWS CLI)

See `DEPLOYMENT.md` for details.

## CDK Development

**Import Best Practice:** Use explicit imports, avoid wildcards

```typescript
// ✅ Good
import { Stack, StackProps } from "aws-cdk-lib";
import { Function, Runtime } from "aws-cdk-lib/aws-lambda";

// ❌ Avoid
import * as cdk from "aws-cdk-lib";
```

**Commands:**

```bash
cd cdk
npm install && npm run build && npm test    # Build & test
npm run lint && npm run format              # Quality
cdk synth && cdk deploy                     # Deploy
```

**Current Versions:**

- CDK: 2.1033.0
- aws-bedrock-agentcore-alpha: ^2.230.0-alpha.0

## CI/CD

- **agent-ci.yml** - Python testing (pytest, mypy, ruff, black)
- **cdk-ci.yml** - TypeScript testing (Jest, ESLint, Prettier)
- Runs on push/PR to main
