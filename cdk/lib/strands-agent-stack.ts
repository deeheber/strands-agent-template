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

    // IAM Role for AgentCore Runtime
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

    // Create AgentCore Runtime with observability via environment variables and IAM
    const runtime = new Runtime(this, 'StrandsAgentRuntime', {
      runtimeName: `${this.stackName.replace(/-/g, '_')}_StrandsAgent`,
      agentRuntimeArtifact: agentArtifact,
      executionRole: agentRole,
      description:
        'Strands agent with calculator, time, and letter counter tools - OTEL observability enabled',
      environmentVariables: {
        AWS_REGION: this.region,
        AWS_DEFAULT_REGION: this.region,
        LOG_LEVEL: 'INFO',
        // Identifier for AgentCore runtime environment (set to static value during deployment)
        BEDROCK_AGENTCORE_RUNTIME_ID: 'agentcore-runtime',
        // OpenTelemetry configuration for observability
        OTEL_SERVICE_NAME: 'strands-agent',
        OTEL_RESOURCE_ATTRIBUTES: `service.name=strands-agent,service.version=0.1.0`,
        OTEL_PROPAGATORS: 'tracecontext,baggage,xray',
        OTEL_PYTHON_DISABLED_INSTRUMENTATIONS: 'urllib3',
        AWS_LAMBDA_EXEC_WRAPPER: '/opt/otel-instrument',
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
