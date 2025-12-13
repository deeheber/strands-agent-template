import { App } from 'aws-cdk-lib'
import { Template, Match } from 'aws-cdk-lib/assertions'
import { StrandsAgentStack } from '../lib/strands-agent-stack'

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

    it('configures required permissions for AgentCore runtime', () => {
      // Verify ECR permissions for container image access
      template.hasResourceProperties('AWS::IAM::Role', {
        Policies: [
          {
            PolicyDocument: {
              Statement: Match.arrayWith([
                Match.objectLike({
                  Sid: 'ECRImageAccess',
                  Effect: 'Allow',
                  Action: [
                    'ecr:BatchGetImage',
                    'ecr:GetDownloadUrlForLayer',
                    'ecr:BatchCheckLayerAvailability',
                  ],
                }),
                Match.objectLike({
                  Sid: 'ECRTokenAccess',
                  Effect: 'Allow',
                  Action: 'ecr:GetAuthorizationToken',
                }),
              ]),
            },
          },
        ],
      })
    })

    it('configures CloudWatch and observability permissions', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        Policies: [
          {
            PolicyDocument: {
              Statement: Match.arrayWith([
                // CloudWatch Logs
                Match.objectLike({
                  Effect: 'Allow',
                  Action: Match.arrayWith([
                    'logs:CreateLogGroup',
                    'logs:CreateLogStream',
                    'logs:PutLogEvents',
                  ]),
                  Resource: Match.stringLikeRegexp(
                    'arn:aws:logs:.+:.+:log-group:/aws/bedrock-agentcore/runtimes/\\*'
                  ),
                }),
                // X-Ray tracing
                Match.objectLike({
                  Effect: 'Allow',
                  Action: Match.arrayWith(['xray:PutTraceSegments', 'xray:PutTelemetryRecords']),
                }),
                // CloudWatch metrics
                Match.objectLike({
                  Effect: 'Allow',
                  Action: 'cloudwatch:PutMetricData',
                  Condition: {
                    StringEquals: {
                      'cloudwatch:namespace': 'bedrock-agentcore',
                    },
                  },
                }),
              ]),
            },
          },
        ],
      })
    })

    it('configures Bedrock model invocation permissions', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        Policies: [
          {
            PolicyDocument: {
              Statement: Match.arrayWith([
                Match.objectLike({
                  Sid: 'BedrockModelInvocation',
                  Effect: 'Allow',
                  Action: ['bedrock:InvokeModel', 'bedrock:InvokeModelWithResponseStream'],
                  Resource: Match.arrayWith(['arn:aws:bedrock:*::foundation-model/*']),
                }),
              ]),
            },
          },
        ],
      })
    })
  })

  describe('Required Resources', () => {
    it('creates exactly one IAM role and runtime', () => {
      template.resourceCountIs('AWS::IAM::Role', 1)
      template.resourceCountIs('AWS::BedrockAgentCore::Runtime', 1)
    })

    it('creates AgentCore runtime with proper configuration', () => {
      template.hasResourceProperties('AWS::BedrockAgentCore::Runtime', {
        AgentRuntimeName: 'TestStrandsAgentStack_StrandsAgent',
        Description: 'Strands agent with calculator, time, and letter counter tools - simplified observability',
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

  describe('AgentRuntimeArtifact Configuration', () => {
    it('configures container artifact correctly', () => {
      template.hasResourceProperties('AWS::BedrockAgentCore::Runtime', {
        AgentRuntimeArtifact: {
          ContainerConfiguration: {
            ContainerUri: {
              'Fn::Sub': Match.stringLikeRegexp('.*\\.dkr\\.ecr\\..+\\..*/.*:.*'),
            },
          },
        },
      })
    })

    it('creates ECR access policy for container deployment', () => {
      // CDK creates additional IAM policy for ECR access
      template.resourceCountIs('AWS::IAM::Policy', 1)

      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith([
                'ecr:BatchCheckLayerAvailability',
                'ecr:GetDownloadUrlForLayer',
                'ecr:BatchGetImage',
              ]),
              Effect: 'Allow',
            }),
          ]),
        },
      })
    })
  })

  describe('Security Validation', () => {
    it('ensures permissions follow principle of least privilege', () => {
      // Verify that ECR permissions are scoped to account resources, not wildcard
      template.hasResourceProperties('AWS::IAM::Role', {
        Policies: [
          {
            PolicyDocument: {
              Statement: Match.arrayWith([
                Match.objectLike({
                  Sid: 'ECRImageAccess',
                  Resource: Match.stringLikeRegexp('arn:aws:ecr:.+:.+:repository/\\*'),
                }),
              ]),
            },
          },
        ],
      })

      // Verify CloudWatch logs are scoped to AgentCore log groups
      template.hasResourceProperties('AWS::IAM::Role', {
        Policies: [
          {
            PolicyDocument: {
              Statement: Match.arrayWith([
                Match.objectLike({
                  Action: Match.arrayWith(['logs:CreateLogGroup']),
                  Resource: Match.stringLikeRegexp('/aws/bedrock-agentcore/runtimes/'),
                }),
              ]),
            },
          },
        ],
      })
    })
  })

  describe('CloudFormation Template Snapshot', () => {
    it('matches the expected template structure', () => {
      // Generate the full CloudFormation template and compare against snapshot
      // This test will catch any unexpected infrastructure changes
      const templateJson = template.toJSON()
      expect(templateJson).toMatchSnapshot()
    })
  })
})
