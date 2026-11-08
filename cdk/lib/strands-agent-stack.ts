import { Stack, StackProps, CfnOutput } from 'aws-cdk-lib'
import { Role, ServicePrincipal, PolicyStatement, Effect } from 'aws-cdk-lib/aws-iam'
import { Platform } from 'aws-cdk-lib/aws-ecr-assets'
import { Construct } from 'constructs'
import { Runtime, AgentRuntimeArtifact, PlatformVersion } from 'aws-cdk-lib/aws-bedrockagentcore'
import * as path from 'path'

interface StrandsAgentStackProps extends StackProps {
  bedrockModelID?: string | undefined
}

export class StrandsAgentStack extends Stack {
  constructor(scope: Construct, id: string, props: StrandsAgentStackProps) {
    super(scope, id, props)

    const agentRole = new Role(this, 'AgentCoreRole', {
      assumedBy: new ServicePrincipal('bedrock-agentcore.amazonaws.com'),
    })

    const agentArtifact = AgentRuntimeArtifact.fromAsset(path.join(__dirname, '../../agent'), {
      platform: Platform.LINUX_ARM64,
      // https://github.com/aws/aws-cdk-cli/issues/650
      extraHash: `${this.account}-${this.region}`,
    })

    const runtime = new Runtime(this, 'StrandsAgentRuntime', {
      runtimeName: `${this.stackName.replace(/-/g, '_')}_StrandsAgent`,
      agentRuntimeArtifact: agentArtifact,
      platformVersion: PlatformVersion.V2,
      executionRole: agentRole,
      description: 'Strands agent with calculator, time, and letter counter tools',
      environmentVariables: {
        AWS_REGION: this.region,
        AWS_DEFAULT_REGION: this.region,
        LOG_LEVEL: 'INFO',
        ...(props.bedrockModelID && { BEDROCK_MODEL_ID: props.bedrockModelID }),
      },
    })

    agentRole.addToPolicy(
      new PolicyStatement({
        sid: 'BedrockModels',
        effect: Effect.ALLOW,
        actions: ['bedrock:InvokeModel', 'bedrock:InvokeModelWithResponseStream'],
        resources: [
          'arn:aws:bedrock:*::foundation-model/*',
          `arn:aws:bedrock:${this.region}:${this.account}:inference-profile/*`,
        ],
      })
    )

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
