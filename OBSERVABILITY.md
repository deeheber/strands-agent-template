# Observability

Start with the session's runtime logs when a request fails. Use traces when you need to see which model or tool calls happened and how long they took.

## Where to Look

In CloudWatch Logs, select the deployment region and open:

```text
/aws/bedrock-agentcore/runtimes/<RuntimeId>-DEFAULT
```

`RuntimeId` comes from the CDK deployment outputs. `DEFAULT` is the runtime endpoint used by this template.

| What you want to know | Log stream |
| --- | --- |
| Did the request work? What error occurred? | `runtime-logs-<session-id>`: application logs, warnings, exceptions, and completion messages. |
| Why isn't the deployed agent starting? | `build-logs-...`: startup and initialization messages. For Docker build failures, check the local CDK deployment output. |
| What did the model receive and return? | `otel-rt-logs`: captured prompts, responses, tool-call content, and structured copies of application and startup logs; trace IDs are included when a trace is active. |
| Which steps happened, and why was the request slow? | `spans`: model calls, tool calls, durations, and relationships between steps; span events can also contain prompt and response text. |

Read access to this log group exposes captured prompts and responses.

Stream names in [AWS's examples](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/observability-view.html) may differ from those shown here, which were observed in this template's deployment.

Your Python `logger.info()`, `logger.warning()`, `logger.exception()`, and `print()` output appears in the runtime stream during requests. Startup output appears in the build stream. Local runs write to the terminal where you started the agent.

## Requests, Sessions, and Traces

- A **request** is one invocation, such as asking the agent to convert a temperature.
- A **session** can contain multiple requests. Reusing its session ID sends requests to the same session; a new ID starts another session.
- A **trace** follows an operation through its steps. Its trace ID connects related records across streams.
- A **span** records one step within a trace, such as a model call or tool call.

Reusing a session ID also reuses its `runtime-logs-<session-id>` stream. The `spans` and `otel-rt-logs` streams collect records across sessions.

This template creates a new Strands `Agent` for every invocation. Reusing a runtime session does not, by itself, preserve the agent's conversation history.

## Follow a Request

1. Open the relevant `runtime-logs-<session-id>` stream. Everything after `runtime-logs-` is the session ID; completion records also include `sessionId`.
2. Find the invocation's log messages and copy their `trace_id`.
3. In CloudWatch Logs Insights, select the same log group and a time range covering the request. Replace `<trace-id>` below with the copied value:

   ```text
   fields @timestamp, @logStream, @message
   | filter @message like /<trace-id>/
   | sort @timestamp asc
   ```

This finds application logs and structured records using either `trace_id` or `traceId`.

## What Unified Storage Changes

Unified storage puts traces, prompt/response records, and application logs in the same log group, in separate streams. Older traces can remain in the shared `aws/spans` group. It does not change the agent's answers or fix the Runtime V2 telemetry limitations described in [#50](https://github.com/deeheber/strands-agent-template/issues/50), which was closed as an upstream issue.

See [DEPLOYMENT.md](DEPLOYMENT.md#prerequisites) for setup requirements, [AWS's observability guide](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/observability-configure.html) for storage configuration, and [session management](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/runtime-invoke-agent.html) for invocation guidance.
