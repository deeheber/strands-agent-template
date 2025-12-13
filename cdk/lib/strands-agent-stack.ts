import { Stack, StackProps, CfnOutput } from 'aws-cdk-lib'
import {
  Role,
  ServicePrincipal,
  PolicyDocument,
  PolicyStatement,
  Effect,
} from 'aws-cdk-lib/aws-iam'
import { Platform } from 'aws-cdk-lib/aws-ecr-assets'
import { Construct } from 'constructs'
import { Runtime, AgentRuntimeArtifact } from '@aws-cdk/aws-bedrock-agentcore-alpha'
import * as path from 'path'

export class StrandsAgentStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props)

    // IAM Role for AgentCore Runtime with comprehensive observability permissions
    const agentRole = new Role(this, 'AgentCoreRole', {
      assumedBy: new ServicePrincipal('bedrock-agentcore.amazonaws.com'),
      inlinePolicies: {
        AgentCorePolicy: new PolicyDocument({
          statements: [
            new PolicyStatement({
              sid: 'ECRImageAccess',
              effect: Effect.ALLOW,
              actions: [
                'ecr:BatchGetImage',
                'ecr:GetDownloadUrlForLayer',
                'ecr:BatchCheckLayerAvailability',
              ],
              resources: [`arn:aws:ecr:${this.region}:${this.account}:repository/*`],
            }),
            new PolicyStatement({
              sid: 'ECRTokenAccess',
              effect: Effect.ALLOW,
              actions: ['ecr:GetAuthorizationToken'],
              resources: ['*'],
            }),
            new PolicyStatement({
              sid: 'CloudWatchLogsAccess',
              effect: Effect.ALLOW,
              actions: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
                'logs:DescribeLogGroups',
                'logs:DescribeLogStreams',
              ],
              resources: [
                `arn:aws:logs:${this.region}:${this.account}:log-group:/aws/bedrock-agentcore/runtimes/*`,
              ],
            }),
            new PolicyStatement({
              sid: 'XRayAccess',
              effect: Effect.ALLOW,
              actions: [
                'xray:PutTraceSegments',
                'xray:PutTelemetryRecords',
                'xray:GetSamplingRules',
                'xray:GetSamplingTargets',
              ],
              resources: ['*'],
            }),
            new PolicyStatement({
              sid: 'CloudWatchMetricsAccess',
              effect: Effect.ALLOW,
              actions: ['cloudwatch:PutMetricData'],
              resources: ['*'],
              conditions: {
                StringEquals: {
                  'cloudwatch:namespace': 'bedrock-agentcore',
                },
              },
            }),
            new PolicyStatement({
              sid: 'BedrockModelInvocation',
              effect: Effect.ALLOW,
              actions: ['bedrock:InvokeModel', 'bedrock:InvokeModelWithResponseStream'],
              resources: [
                'arn:aws:bedrock:*::foundation-model/*',
                `arn:aws:bedrock:${this.region}:${this.account}:*`,
              ],
            }),
          ],
        }),
      },
    })

    // Build Docker image from local agent code
    const agentArtifact = AgentRuntimeArtifact.fromAsset(path.join(__dirname, '../../agent'), {
      platform: Platform.LINUX_ARM64,
      file: 'Dockerfile',
    })

    // Create AgentCore Runtime with fully automated observability
    // AgentCore handles ALL observability automatically with strands-agents[otel] dependency
    const runtime = new Runtime(this, 'StrandsAgentRuntime', {
      runtimeName: `${this.stackName.replace(/-/g, '_')}_StrandsAgent`,
      agentRuntimeArtifact: agentArtifact,
      executionRole: agentRole,
      description:
        'Strands agent with calculator, time, and letter counter tools - fully automated observability with strands-agents[otel]',
      environmentVariables: {
        AWS_REGION: this.region,
        AWS_DEFAULT_REGION: this.region,
        LOG_LEVEL: 'INFO',
      },
    })

    // Outputs
    new CfnOutput(this, 'RuntimeId', {
      description: 'AgentCore Runtime ID',
      value: runtime.agentRuntimeId,
    })

    new CfnOutput(this, 'RuntimeArn', {
      description: 'AgentCore Runtime ARN',
      value: runtime.agentRuntimeArn,
    })
  }
}
