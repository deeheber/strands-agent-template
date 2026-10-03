# CDK Infrastructure

Deploys one ARM64 AgentCore runtime with an IAM role and policy. CDK builds the Python container from `../agent`; the app reads optional configuration from `../agent/.env`.

## Deploy

From this directory, with Node.js 24, Docker, and AWS credentials configured:

```bash
export AWS_REGION=us-west-2
export AWS_DEFAULT_REGION=us-west-2
npm ci
npx cdk bootstrap  # Once per AWS account/region
npm run cdk:deploy
```

See [DEPLOYMENT.md](../DEPLOYMENT.md) for model access, smoke tests, logs, and cleanup.

## Development

```bash
npm run build
npm test
npm run check
```

`npm run fix` applies lint fixes and formatting. To synthesize without AWS credentials:

```bash
CDK_DEFAULT_ACCOUNT=000000000000 CDK_DEFAULT_REGION=us-west-2 npm run cdk:synth
```

These placeholder values are for validation only. Deploy using your real AWS account and region.
