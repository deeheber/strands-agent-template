/// <reference types="vitest/globals" />
import { App } from 'aws-cdk-lib'
import { Template, Match } from 'aws-cdk-lib/assertions'
import { StrandsAgentStack } from '../lib/strands-agent-stack'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

describe('StrandsAgentStack', () => {
  let app: App
  let stack: StrandsAgentStack
  let template: Template

  beforeEach(() => {
    app = new App()
    stack = new StrandsAgentStack(app, 'TestStrandsAgentStack', {
      env: {
        account: '123456789012',
        region: 'us-west-2',
      },
    })
    template = Template.fromStack(stack)
  })

  describe('IAM Role and Permissions', () => {
    it('creates AgentCore IAM role with correct trust relationship', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'bedrock-agentcore.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            },
          ],
        },
      })
    })

    it('configures Bedrock model invocation permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: ['bedrock:InvokeModel', 'bedrock:InvokeModelWithResponseStream'],
              Effect: 'Allow',
              Resource: [
                'arn:aws:bedrock:*::foundation-model/*',
                'arn:aws:bedrock:us-west-2:123456789012:inference-profile/*',
              ],
            }),
          ]),
        },
      })
    })
  })

  describe('Required Resources', () => {
    it('creates exactly one IAM role, one policy, and one runtime', () => {
      template.resourceCountIs('AWS::IAM::Role', 1)
      template.resourceCountIs('AWS::IAM::Policy', 1)
      template.resourceCountIs('AWS::BedrockAgentCore::Runtime', 1)
    })

    it('creates AgentCore runtime with proper configuration', () => {
      template.hasResourceProperties('AWS::BedrockAgentCore::Runtime', {
        AgentRuntimeName: 'TestStrandsAgentStack_StrandsAgent',
        Description: 'Strands agent with calculator, time, and letter counter tools',
        RoleArn: {
          'Fn::GetAtt': [Match.stringLikeRegexp('AgentCoreRole.*'), 'Arn'],
        },
      })
    })

    it('configures required environment variables', () => {
      template.hasResourceProperties('AWS::BedrockAgentCore::Runtime', {
        EnvironmentVariables: {
          AWS_REGION: 'us-west-2',
          AWS_DEFAULT_REGION: 'us-west-2',
          LOG_LEVEL: 'INFO',
        },
      })
    })

    it('creates stack outputs for runtime access', () => {
      template.hasOutput('RuntimeId', {
        Description: 'AgentCore Runtime ID',
        Value: {
          'Fn::GetAtt': [Match.stringLikeRegexp('StrandsAgentRuntime.*'), 'AgentRuntimeId'],
        },
      })

      template.hasOutput('RuntimeArn', {
        Description: 'AgentCore Runtime ARN',
        Value: {
          'Fn::GetAtt': [Match.stringLikeRegexp('StrandsAgentRuntime.*'), 'AgentRuntimeArn'],
        },
      })
    })
  })

  describe('CloudFormation Template Snapshot', () => {
    it('matches the expected template structure', () => {
      const templateJson = template.toJSON()

      // Replace dynamic containerUri hash with stable placeholder for snapshot testing
      const templateString = JSON.stringify(templateJson)
      const normalizedTemplate = templateString.replace(/:[\da-f]{64}"/g, ':MOCKED_CONTAINER_HASH"')

      expect(JSON.parse(normalizedTemplate)).toMatchSnapshot()
    })
  })
})

describe('CDK environment configuration', () => {
  it.each([
    ['', undefined],
    ['   ', undefined],
    ['  us.anthropic.claude-sonnet-4-6  ', 'us.anthropic.claude-sonnet-4-6'],
  ])('normalizes the model override %j before synthesis', (modelId, expected) => {
    const output = mkdtempSync(join(tmpdir(), 'strands-config-'))
    try {
      const result = spawnSync(process.execPath, ['--import', 'tsx', 'bin/cdk.ts'], {
        env: {
          ...process.env,
          CDK_DEFAULT_ACCOUNT: '000000000000',
          CDK_DEFAULT_REGION: 'us-west-2',
          BEDROCK_MODEL_ID: modelId,
          CDK_OUTDIR: output,
        },
        encoding: 'utf8',
      })
      expect(result.status, result.stderr).toBe(0)
      const template = Template.fromJSON(
        JSON.parse(readFileSync(join(output, 'StrandsAgentStack.template.json'), 'utf8')) as Record<
          string,
          unknown
        >
      )
      template.hasResourceProperties('AWS::BedrockAgentCore::Runtime', {
        EnvironmentVariables: {
          BEDROCK_MODEL_ID: expected ?? Match.absent(),
        },
      })
    } finally {
      rmSync(output, { recursive: true, force: true })
    }
  })

  it('explains missing AWS configuration without a validation stack trace', () => {
    const result = spawnSync(process.execPath, ['--import', 'tsx', 'bin/cdk.ts'], {
      env: {
        ...process.env,
        CDK_DEFAULT_ACCOUNT: '',
        CDK_DEFAULT_REGION: '',
        AWS_DEFAULT_ACCOUNT_ID: '',
        AWS_DEFAULT_REGION: '',
      },
      encoding: 'utf8',
    })
    expect(result.status).toBe(1)
    expect(result.stderr).toContain('AWS account not found')
    expect(result.stderr).toContain('AWS region not found')
    expect(result.stderr).not.toContain('ZodError')
  })
})
