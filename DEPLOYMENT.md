# Deployment Guide

## Prerequisites

- Python 3.14, [uv](https://docs.astral.sh/uv/) 0.12, Node.js 24, and AWS CLI v2.
- Docker running and able to build `linux/arm64` images.
- AWS credentials for CDK deployment and permission to invoke the deployed runtime.
- Access to the selected Bedrock model. Follow the [Bedrock model access instructions](https://docs.aws.amazon.com/bedrock/latest/userguide/model-access.html), including any first-use requirements for Anthropic models.

These examples use `us-west-2`. Check [AgentCore region availability](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/agentcore-regions.html) and model availability before choosing another region.

```bash
export AWS_REGION=us-west-2
export AWS_DEFAULT_REGION=us-west-2
aws sts get-caller-identity
```

Check that the returned account is where you intend to deploy. Set `AWS_PROFILE` first if using a named profile.

## Configuration

The default model is `us.anthropic.claude-sonnet-4-6`. To override it, copy `agent/.env.example` to `agent/.env` and set `BEDROCK_MODEL_ID` to a tool-capable Bedrock model ID.

CDK reads `agent/.env` automatically. For local runs, load it explicitly:

```bash
# From the repository root
cd agent
uv sync --locked
uv run --env-file .env python src/agentcore_app.py
```

Shell variables take precedence over the file. Empty or whitespace-only model values use the default. `LOG_LEVEL` configures local logging; the deployed runtime uses INFO.

If updating an older fork, move model settings from `cdk/.env` into `agent/.env`. CDK no longer reads `cdk/.env`.

## Deploy

From the repository root, with the region set as above:

```bash
cd cdk
npm ci
npx cdk bootstrap  # Once per AWS account/region
npm run cdk:deploy
```

CDK builds and uploads the container image, then creates or updates `StrandsAgentStack`. The stack contains the AgentCore runtime, its IAM role, and policy. Save the `RuntimeArn` and `RuntimeId` outputs.

GitHub Actions run checks and synthesize without AWS credentials; deployments are manual.

## Smoke Test

Set `RUNTIME_ARN` to the deployment output:

```bash
RUNTIME_ARN="<RuntimeArn output>"
aws bedrock-agentcore invoke-agent-runtime \
  --region us-west-2 \
  --agent-runtime-arn "$RUNTIME_ARN" \
  --qualifier DEFAULT \
  --content-type application/json \
  --cli-binary-format raw-in-base64-out \
  --cli-read-timeout 180 \
  --payload '{"prompt":"Use calculator to calculate 42 * 137."}' \
  response.json
cat response.json
```

Expect JSON like this; wording varies:

```json
{"status":"success","response":"42 × 137 = 5,754.\n"}
```

Check both `status` and the answer; HTTP success alone is not enough. You can also ask `Use letter_counter to count r in strawberry.` and expect 3.

## Logs and Troubleshooting

Use the `RuntimeId` output to tail the runtime logs:

```bash
RUNTIME_ID="<RuntimeId output>"
aws logs tail "/aws/bedrock-agentcore/runtimes/${RUNTIME_ID}-DEFAULT" \
  --region us-west-2 --since 10m --follow
```

- Build failure: check `docker ps` and the CDK build output.
- Access denied: check the active AWS identity, deployment permissions, and Bedrock model access.
- `status: "error"`: inspect the runtime logs for the underlying exception.

## Customize and Redeploy

Replace the demo tools or agent configuration using the [agent guide](agent/README.md). Run the [development checks](CONTRIBUTING.md#checks), then repeat `npm run cdk:deploy` from `cdk/` and smoke-test again.

## Cleanup

From the repository root:

```bash
cd cdk
npm run cdk:destroy
```

This removes the runtime and its IAM resources.
