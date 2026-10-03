#!/usr/bin/env node
import { App } from 'aws-cdk-lib'
import { z } from 'zod'

import { StrandsAgentStack } from '../lib/strands-agent-stack'

const envSchema = z
  .object({
    CDK_DEFAULT_ACCOUNT: z.string().optional(),
    CDK_DEFAULT_REGION: z.string().optional(),
    AWS_DEFAULT_ACCOUNT_ID: z.string().optional(),
    AWS_DEFAULT_REGION: z.string().optional(),
    BEDROCK_MODEL_ID: z
      .string()
      .trim()
      .transform((value) => value || undefined)
      .optional(),
  })
  .refine((data) => data.CDK_DEFAULT_ACCOUNT ?? data.AWS_DEFAULT_ACCOUNT_ID, {
    message:
      '❌ AWS account not found. Please configure AWS CLI credentials by running "aws configure", set AWS_PROFILE environment variable, or set CDK_DEFAULT_ACCOUNT environment variable.',
  })
  .refine((data) => data.CDK_DEFAULT_REGION ?? data.AWS_DEFAULT_REGION, {
    message:
      '❌ AWS region not found. Please configure AWS CLI credentials by running "aws configure", set AWS_PROFILE environment variable, or set CDK_DEFAULT_REGION environment variable.',
  })

const parsed = envSchema.safeParse(process.env)
if (!parsed.success) {
  console.error(z.prettifyError(parsed.error))
  process.exit(1)
}
const env = parsed.data

const account = (env.CDK_DEFAULT_ACCOUNT ?? env.AWS_DEFAULT_ACCOUNT_ID)!
const region = (env.CDK_DEFAULT_REGION ?? env.AWS_DEFAULT_REGION)!

const app = new App()
new StrandsAgentStack(app, 'StrandsAgentStack', {
  description: 'Demo template for strands-agents',
  bedrockModelID: env.BEDROCK_MODEL_ID,
  env: { account, region },
})
