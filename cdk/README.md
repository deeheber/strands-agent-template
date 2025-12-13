# CDK Infrastructure for Strands AgentCore Deployment

This CDK stack deploys Strands agents to Amazon Bedrock AgentCore Runtime.

## Quick Deploy

```bash
npm install
npm run build
cdk deploy
```

## What Gets Deployed

- AgentCore Runtime (ARM64 container)
- IAM execution role
- CloudWatch logging

## Full Documentation

See [DEPLOYMENT.md](../DEPLOYMENT.md) for:

- Prerequisites
- Local testing
- Deployment steps
- Testing the deployed agent
- Monitoring and troubleshooting
- Cost estimates

## Development

```bash
npm test          # Run tests
npm run lint      # Lint code
npm run format    # Format code
cdk synth         # Synthesize CloudFormation
```

## Testing

```bash
npm test                    # Run all tests
npm test -- -u             # Update snapshots
```

Tests validate IAM permissions, resource configuration, security compliance, and infrastructure snapshots with containerUri mocking for stable builds.
