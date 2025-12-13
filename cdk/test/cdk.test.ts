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

  describe('Snapshot Tests', () => {
    it('matches the CloudFormation template snapshot', () => {
      // Snapshot test to detect unexpected changes in infrastructure
      expect(template.toJSON()).toMatchSnapshot()
    })

    it('matches the stack synthesis snapshot', () => {
      // Test the full stack synthesis
      expect(app.synth().getStackByName(stack.stackName).template).toMatchSnapshot()
    })
  })

  describe('IAM Role Tests', () => {
    it('creates AgentCore IAM role with correct trust policy', () => {
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

    it('creates IAM role with ECR permissions', () => {
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
                  Resource: Match.stringLikeRegexp('arn:aws:ecr:.+:.+:repository/\\*'),
                }),
              ]),
            },
          },
        ],
      })
    })

    it('creates IAM role with ECR token access', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        Policies: [
          {
            PolicyDocument: {
              Statement: Match.arrayWith([
                Match.objectLike({
                  Sid: 'ECRTokenAccess',
                  Effect: 'Allow',
                  Action: 'ecr:GetAuthorizationToken',
                  Resource: '*',
                }),
              ]),
            },
          },
        ],
      })
    })

    it('creates IAM role with CloudWatch Logs permissions', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        Policies: [
          {
            PolicyDocument: {
              Statement: Match.arrayWith([
                Match.objectLike({
                  Effect: 'Allow',
                  Action: [
                    'logs:CreateLogGroup',
                    'logs:CreateLogStream',
                    'logs:PutLogEvents',
                    'logs:DescribeLogGroups',
                    'logs:DescribeLogStreams',
                  ],
                  Resource: Match.stringLikeRegexp(
                    'arn:aws:logs:.+:.+:log-group:/aws/bedrock-agentcore/runtimes/\\*'
                  ),
                }),
              ]),
            },
          },
        ],
      })
    })

    it('creates IAM role with X-Ray permissions', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        Policies: [
          {
            PolicyDocument: {
              Statement: Match.arrayWith([
                Match.objectLike({
                  Effect: 'Allow',
                  Action: [
                    'xray:PutTraceSegments',
                    'xray:PutTelemetryRecords',
                    'xray:GetSamplingRules',
                    'xray:GetSamplingTargets',
                  ],
                  Resource: '*',
                }),
              ]),
            },
          },
        ],
      })
    })

    it('creates IAM role with CloudWatch metrics permissions', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        Policies: [
          {
            PolicyDocument: {
              Statement: Match.arrayWith([
                Match.objectLike({
                  Effect: 'Allow',
                  Action: 'cloudwatch:PutMetricData',
                  Resource: '*',
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

    it('creates IAM role with Bedrock model invocation permissions', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        Policies: [
          {
            PolicyDocument: {
              Statement: Match.arrayWith([
                Match.objectLike({
                  Sid: 'BedrockModelInvocation',
                  Effect: 'Allow',
                  Action: ['bedrock:InvokeModel', 'bedrock:InvokeModelWithResponseStream'],
                  Resource: [
                    'arn:aws:bedrock:*::foundation-model/*',
                    Match.stringLikeRegexp('arn:aws:bedrock:.+:.+:\\*'),
                  ],
                }),
              ]),
            },
          },
        ],
      })
    })
  })

  describe('AgentCore Runtime Tests', () => {
    it('creates Bedrock AgentCore Runtime with correct configuration', () => {
      template.hasResourceProperties('AWS::BedrockAgentCore::Runtime', {
        AgentRuntimeName: Match.stringLikeRegexp('.*_StrandsAgent'),
        Description: 'Strands agent with calculator, time, and letter counter tools',
        EnvironmentVariables: {
          AWS_REGION: 'us-west-2',
          AWS_DEFAULT_REGION: 'us-west-2',
          LOG_LEVEL: 'INFO',
        },
      })
    })

    it('associates AgentCore Runtime with correct IAM role', () => {
      template.hasResourceProperties('AWS::BedrockAgentCore::Runtime', {
        RoleArn: {
          'Fn::GetAtt': [Match.stringLikeRegexp('AgentCoreRole.*'), 'Arn'],
        },
      })
    })

    it('configures AgentRuntimeArtifact with correct settings', () => {
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
  })

  describe('ECR Asset Tests', () => {
    it('creates ECR repository for Docker image', () => {
      // ECR repositories are created by CDK for container assets
      template.resourceCountIs('AWS::ECR::Repository', 0) // ECR repos are created in the bootstrap stack, not here
    })

    it('creates additional IAM policies for ECR access', () => {
      // The CDK creates additional policies for ECR access beyond the inline policies
      template.resourceCountIs('AWS::IAM::Policy', 1)

      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: [
                'ecr:BatchCheckLayerAvailability',
                'ecr:GetDownloadUrlForLayer',
                'ecr:BatchGetImage',
              ],
              Effect: 'Allow',
              Resource: Match.objectLike({
                'Fn::Join': Match.arrayWith([
                  '',
                  Match.arrayWith([
                    'arn:',
                    Match.objectLike({
                      Ref: 'AWS::Partition',
                    }),
                    Match.stringLikeRegexp(':ecr:.+:.+:repository/.*'),
                  ]),
                ]),
              }),
            }),
          ]),
        },
      })
    })
  })

  describe('Output Tests', () => {
    it('exports RuntimeId output', () => {
      template.hasOutput('RuntimeId', {
        Description: 'AgentCore Runtime ID',
        Value: {
          'Fn::GetAtt': [Match.stringLikeRegexp('StrandsAgentRuntime.*'), 'AgentRuntimeId'],
        },
      })
    })

    it('exports RuntimeArn output', () => {
      template.hasOutput('RuntimeArn', {
        Description: 'AgentCore Runtime ARN',
        Value: {
          'Fn::GetAtt': [Match.stringLikeRegexp('StrandsAgentRuntime.*'), 'AgentRuntimeArn'],
        },
      })
    })
  })

  describe('Resource Count Tests', () => {
    it('creates exactly one IAM role', () => {
      template.resourceCountIs('AWS::IAM::Role', 1)
    })

    it('creates exactly one Bedrock AgentCore Runtime', () => {
      template.resourceCountIs('AWS::BedrockAgentCore::Runtime', 1)
    })

    it('creates additional IAM policy for ECR access', () => {
      template.resourceCountIs('AWS::IAM::Policy', 1)
    })

    it('creates expected number of total resources', () => {
      const templateJson = template.toJSON()
      const resources = templateJson.Resources as Record<string, unknown>
      const resourceCount = Object.keys(resources).length

      // Expected resources: IAM Role, IAM Policy, Bedrock AgentCore Runtime, plus Bootstrap parameter
      expect(resourceCount).toBeGreaterThanOrEqual(3)
      expect(resourceCount).toBeLessThanOrEqual(10) // Reasonable upper bound
    })
  })

  describe('Security Tests', () => {
    it('does not create resources with overly permissive policies', () => {
      const templateJson = template.toJSON()
      const resources = templateJson.Resources as Record<
        string,
        {
          Type: string
          Properties?: {
            Policies?: {
              PolicyDocument: {
                Statement: {
                  Action: string | string[]
                  Resource: string
                }[]
              }
            }[]
          }
        }
      >

      // Check that no resource has policies with "*" action on "*" resource
      Object.values(resources).forEach((resource) => {
        if (resource.Type === 'AWS::IAM::Role' && resource.Properties?.Policies) {
          resource.Properties.Policies.forEach((policy) => {
            policy.PolicyDocument.Statement.forEach((statement) => {
              if (Array.isArray(statement.Action) && statement.Action.includes('*')) {
                expect(statement.Resource).not.toBe('*')
              }
            })
          })
        }
      })
    })

    it('ensures IAM role follows principle of least privilege', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        Policies: [
          {
            PolicyDocument: {
              Statement: Match.arrayWith([
                // Ensure ECR permissions are scoped to specific repository ARNs
                Match.objectLike({
                  Sid: 'ECRImageAccess',
                  Resource: Match.not('*'),
                }),
                // Ensure CloudWatch Logs permissions are scoped to specific log groups
                Match.objectLike({
                  Action: Match.arrayWith(['logs:CreateLogGroup']),
                  Resource: Match.not('*'),
                }),
              ]),
            },
          },
        ],
      })
    })
  })

  describe('Environment Variable Tests', () => {
    it('sets required environment variables for AgentCore Runtime', () => {
      template.hasResourceProperties('AWS::BedrockAgentCore::Runtime', {
        EnvironmentVariables: Match.objectLike({
          AWS_REGION: Match.anyValue(),
          AWS_DEFAULT_REGION: Match.anyValue(),
          LOG_LEVEL: 'INFO',
        }),
      })
    })

    it('ensures AWS region variables are consistent', () => {
      template.hasResourceProperties('AWS::BedrockAgentCore::Runtime', {
        EnvironmentVariables: {
          AWS_REGION: 'us-west-2',
          AWS_DEFAULT_REGION: 'us-west-2',
        },
      })
    })
  })

  describe('Naming Convention Tests', () => {
    it('follows consistent naming patterns for resources', () => {
      const templateJson = template.toJSON()
      const resources = templateJson.Resources as Record<string, { Type: string }>

      // Check that IAM role follows naming convention
      const iamRoles = Object.keys(resources).filter(
        (key) => resources[key]?.Type === 'AWS::IAM::Role'
      )
      expect(iamRoles.length).toBe(1)
      expect(iamRoles[0]).toMatch(/AgentCoreRole/)

      // Check that AgentCore Runtime follows naming convention
      const runtimes = Object.keys(resources).filter(
        (key) => resources[key]?.Type === 'AWS::BedrockAgentCore::Runtime'
      )
      expect(runtimes.length).toBe(1)
      expect(runtimes[0]).toMatch(/StrandsAgentRuntime/)
    })

    it('uses stack name in runtime configuration', () => {
      template.hasResourceProperties('AWS::BedrockAgentCore::Runtime', {
        AgentRuntimeName: 'TestStrandsAgentStack_StrandsAgent',
      })
    })
  })

  describe('Advanced Configuration Tests', () => {
    it('configures runtime lifecycle settings', () => {
      template.hasResourceProperties('AWS::BedrockAgentCore::Runtime', {
        LifecycleConfiguration: {
          IdleRuntimeSessionTimeout: 60,
          MaxLifetime: 28800,
        },
      })
    })

    it('configures network settings', () => {
      template.hasResourceProperties('AWS::BedrockAgentCore::Runtime', {
        NetworkConfiguration: {
          NetworkMode: 'PUBLIC',
        },
      })
    })

    it('configures protocol settings', () => {
      template.hasResourceProperties('AWS::BedrockAgentCore::Runtime', {
        ProtocolConfiguration: 'HTTP',
      })
    })

    it('sets up proper dependencies between resources', () => {
      template.hasResource('AWS::BedrockAgentCore::Runtime', {
        DependsOn: Match.arrayWith([Match.stringLikeRegexp('AgentCoreRole.*')]),
      })
    })
  })

  describe('Bootstrap and CDK Integration Tests', () => {
    it('includes CDK bootstrap version parameter', () => {
      const templateJson = template.toJSON()
      const parameters = templateJson.Parameters as Record<
        string,
        {
          Type: string
          Default?: string
          Description?: string
        }
      >

      expect(parameters).toHaveProperty('BootstrapVersion')
      const bootstrapParam = parameters.BootstrapVersion
      expect(bootstrapParam).toMatchObject({
        Type: 'AWS::SSM::Parameter::Value<String>',
        Default: '/cdk-bootstrap/hnb659fds/version',
        Description: expect.stringContaining('CDK Bootstrap') as string,
      })
    })

    it('validates template structure integrity', () => {
      interface TemplateStructure {
        Resources: Record<string, unknown>
        Outputs: Record<string, unknown>
        Parameters: Record<string, unknown>
      }

      const templateJson = template.toJSON() as TemplateStructure

      // Ensure template has all required sections
      expect(templateJson).toHaveProperty('Resources')
      expect(templateJson).toHaveProperty('Outputs')
      expect(templateJson).toHaveProperty('Parameters')

      // Ensure Resources section is not empty
      expect(Object.keys(templateJson.Resources).length).toBeGreaterThan(0)

      // Ensure Outputs section contains our expected outputs
      expect(Object.keys(templateJson.Outputs)).toContain('RuntimeId')
      expect(Object.keys(templateJson.Outputs)).toContain('RuntimeArn')
    })
  })

  describe('IAM Permission Boundary Tests', () => {
    it('includes bedrock-agentcore specific permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Sid: 'GetAgentAccessToken',
              Effect: 'Allow',
              Action: [
                'bedrock-agentcore:GetWorkloadAccessToken',
                'bedrock-agentcore:GetWorkloadAccessTokenForJWT',
                'bedrock-agentcore:GetWorkloadAccessTokenForUserId',
              ],
              Resource: Match.arrayWith([
                Match.objectLike({
                  'Fn::Join': Match.arrayWith([
                    '',
                    Match.arrayWith([
                      'arn:',
                      Match.objectLike({ Ref: 'AWS::Partition' }),
                      ':bedrock-agentcore:us-west-2:123456789012:workload-identity-directory/default',
                    ]),
                  ]),
                }),
              ]),
            }),
          ]),
        },
      })
    })

    it('includes granular CloudWatch Logs permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Sid: 'LogGroupAccess',
              Effect: 'Allow',
              Action: ['logs:DescribeLogStreams', 'logs:CreateLogGroup'],
            }),
            Match.objectLike({
              Sid: 'DescribeLogGroups',
              Effect: 'Allow',
              Action: 'logs:DescribeLogGroups',
            }),
            Match.objectLike({
              Sid: 'LogStreamAccess',
              Effect: 'Allow',
              Action: ['logs:CreateLogStream', 'logs:PutLogEvents'],
            }),
          ]),
        },
      })
    })
  })
})
