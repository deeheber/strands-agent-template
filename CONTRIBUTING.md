# Contributing to Strands Agent Template

Keep changes focused on a small, deployable starting point for people building their own agents.

## Setup

Use Python 3.14, uv 0.12, and Node.js 24. From your cloned repository's root:

```bash
cd agent
uv sync --locked
cd ../cdk
npm ci
```

Tests use mocks or synthesized templates and do not need AWS credentials. Running the agent against Bedrock or deploying requires AWS access; see [DEPLOYMENT.md](DEPLOYMENT.md).

## Checks

From the repository root:

```bash
cd agent
uv run --locked pytest
uv run --locked mypy src/
uv run --locked ruff check .
uv run --locked black --check .
cd ../cdk
npm run build
npm test
npm run check
CDK_DEFAULT_ACCOUNT=000000000000 CDK_DEFAULT_REGION=us-west-2 npm run cdk:synth
```

These commands do not reformat source files. For automatic fixes, run `./quality-check.sh` from `agent/` or `npm run fix` from `cdk/`.

GitHub Actions run the Python and CDK checks on pull requests and pushes to `main`. CI synthesis uses placeholder account/region values and does not deploy.

## Code and Tests

- Python uses Black, Ruff, strict mypy, and pytest, with a 100-character line limit.
- TypeScript uses Prettier, ESLint, and Vitest. Use named imports from `aws-cdk-lib`; Node built-in namespace imports are allowed.
- Add regression tests for changed behavior. For tools, follow the [agent guide](agent/README.md#adding-tools).
- Review synthesized infrastructure changes before updating snapshots.

## Pull Requests

Create a branch, make the change, and run the relevant checks. In the PR, explain what changed, why, and what you tested. Include any deployment or live-invocation results separately from unit-test results.
