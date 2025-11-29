# Product Overview

Strands Agent Template - a CDK-based deployment template for Strands AI agents to AWS Bedrock AgentCore Runtime.

## Purpose

This is a template repository for deploying Strands-based AI agents to AWS Bedrock AgentCore Runtime using AWS CDK. It provides infrastructure-as-code for building Python agents that can use tools, process natural language requests, and execute tasks autonomously in a serverless environment.

## Current State

- Python agent implementation using Strands framework with custom and community tools
- CDK infrastructure specifically designed for AWS Bedrock AgentCore Runtime deployment
- Single agent implementation (`agentcore_app.py`) that runs locally and deploys to AgentCore
- Uses `@aws-cdk/aws-bedrock-agentcore-alpha` constructs for AgentCore integration

## Deployment

The agent can be deployed to AWS Bedrock AgentCore Runtime, which provides:

- Serverless container hosting
- Automatic scaling
- Built-in observability (CloudWatch Logs)
- Integration with Bedrock foundation models

**Region**: The deployment region is automatically determined from your AWS CLI configuration. Ensure Bedrock AgentCore is available in your chosen region.

See `DEPLOYMENT.md` for complete deployment instructions.
