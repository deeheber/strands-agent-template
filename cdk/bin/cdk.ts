#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib/core'
import { StrandsAgentStack } from '../lib/strands-agent-stack'

const { AWS_DEFAULT_ACCOUNT_ID, AWS_DEFAULT_REGION, CDK_DEFAULT_ACCOUNT, CDK_DEFAULT_REGION } =
  process.env

const account = CDK_DEFAULT_ACCOUNT ?? AWS_DEFAULT_ACCOUNT_ID
const region = CDK_DEFAULT_REGION ?? AWS_DEFAULT_REGION

if (!account || !region) {
  throw new Error(
    `❌ AWS account and region not found.

🔧 Please configure AWS CLI credentials by running "aws configure", set AWS_PROFILE environment variable, or set CDK_DEFAULT_ACCOUNT/CDK_DEFAULT_REGION environment variables.`
  )
}

const app = new cdk.App()
new StrandsAgentStack(app, 'StrandsAgentStack', {
  description: 'Demo template for strands-agents',
  env: { account, region },
})
