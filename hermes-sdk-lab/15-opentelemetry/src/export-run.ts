/**
 * The same spans through OpenTelemetry JS (lesson 0023).
 *
 * exportRun does not pair trace lines itself. It asks lab 14's costReport,
 * which already decided what a step is, and hands each span to a tracer
 * with the recorded start and end times. What the library adds is ids,
 * parent links, a time format and an exporter. What it does not decide is
 * which lines make a span, what a call cost, or where the alert goes.
 *
 * The trace file stays the one record. Everything emitted here is computed
 * from it after the run, so an export can be thrown away and made again.
 */
import { context, SpanKind, SpanStatusCode, trace, type Attributes, type Context, type Tracer } from "@opentelemetry/api";
import type { TraceEvent } from "../../07-tool-loop/src/trace.js";
import { costReport, type CostReport, type CostReportResult, type ModelSpan, type ToolSpan } from "../../14-reliability/src/cost-report.js";
import type { ModelPrice } from "../../14-reliability/src/prices.js";
import { GEN_AI, HERMES, PROVIDER, WORKFLOW_NAME } from "./conventions.js";

export const JOB_SPAN_NAME = `invoke_workflow ${WORKFLOW_NAME}`;

/**
 * Emits one span for the job and one per step, then returns lab 14's
 * report. A record the report refuses emits nothing.
 *
 * Every end() passes the recorded time. A span whose start was given and
 * whose end was not ends at Date.now(), so a replayed run would last until
 * the moment of export (the third test in "what the library does not decide").
 */
export function exportRun(events: TraceEvent[], price: ModelPrice, tracer: Tracer): CostReportResult {
  const result = costReport(events, price);
  if (!result.ok) return result;
  const { report } = result;

  const startedAt = events.find((e) => e.kind === "job_started")?.at ?? 0;
  // A record cut short has no job_ended: the job span ends at the last line.
  const endedAt = events.find((e) => e.kind === "job_ended")?.at ?? Math.max(...events.map((e) => e.at));

  const job = tracer.startSpan(JOB_SPAN_NAME, {
    kind: SpanKind.INTERNAL,
    startTime: startedAt,
    attributes: jobAttributes(report),
  });
  const parent = trace.setSpan(context.active(), job);

  for (const span of report.spans) {
    if (span.kind === "model") emitModel(tracer, parent, span, report.model, report.alert);
    else emitTool(tracer, parent, span);
  }
  job.end(endedAt);
  return result;
}

function jobAttributes(report: CostReport): Attributes {
  return {
    [GEN_AI.operation]: "invoke_workflow",
    [GEN_AI.workflowName]: WORKFLOW_NAME,
    [HERMES.title]: report.title,
    [HERMES.ceilingTokens]: report.ceilingTokens,
    [HERMES.totalCalls]: report.totals.calls,
    [HERMES.totalTokens]: report.totals.tokens,
    [HERMES.totalMicroUsd]: report.totals.microUsd,
    [HERMES.agrees]: report.agrees,
    ...(report.recorded === null ? {} : { [HERMES.outcome]: report.recorded.outcome }),
    ...(report.carried === null
      ? {}
      : { [HERMES.carriedCalls]: report.carried.calls, [HERMES.carriedTokens]: report.carried.tokens }),
  };
}

function emitModel(
  tracer: Tracer,
  parent: Context,
  span: ModelSpan,
  model: string,
  alert: CostReport["alert"],
): void {
  const attributes: Attributes = {
    [GEN_AI.operation]: "chat",
    [GEN_AI.provider]: PROVIDER,
    [GEN_AI.requestModel]: model,
    [HERMES.call]: span.call,
    [HERMES.tokens]: span.tokens,
    [HERMES.tokensSource]: span.source,
    [HERMES.microUsd]: span.microUsd,
  };
  // Usage attributes mean "reported by the provider". A remainder was not,
  // so a cut-off call carries hermes.tokens and no gen_ai.usage.* at all.
  if (span.inputTokens !== null) attributes[GEN_AI.inputTokens] = span.inputTokens;
  if (span.outputTokens !== null) attributes[GEN_AI.outputTokens] = span.outputTokens;
  if (span.requestId !== null) attributes[HERMES.requestId] = span.requestId;
  if (span.pack !== null) {
    attributes[HERMES.packIds] = span.pack.ids;
    attributes[HERMES.packChars] = span.pack.chars;
    attributes[HERMES.packTokens] = span.pack.tokens;
  }

  const emitted = tracer.startSpan(
    `chat ${model}`,
    { kind: SpanKind.CLIENT, startTime: span.startedAt, attributes },
    parent,
  );
  if (alert !== null && alert.call === span.call) {
    emitted.addEvent(
      HERMES.alert,
      { [HERMES.tokensAfter]: alert.tokensAfter, [HERMES.estimated]: alert.estimated },
      span.endedAt,
    );
  }
  emitted.end(span.endedAt);
}

function emitTool(tracer: Tracer, parent: Context, span: ToolSpan): void {
  const attributes: Attributes = {
    [GEN_AI.operation]: "execute_tool",
    [GEN_AI.toolName]: span.tool,
    [GEN_AI.toolCallId]: span.id,
    [HERMES.call]: span.call,
    [HERMES.decision]: span.decision,
  };
  if (span.heldMs !== null) attributes[HERMES.heldMs] = span.heldMs;

  const emitted = tracer.startSpan(
    `execute_tool ${span.tool}`,
    { kind: SpanKind.INTERNAL, startTime: span.startedAt, attributes },
    parent,
  );
  if (span.failed) emitted.setStatus({ code: SpanStatusCode.ERROR });
  emitted.end(span.endedAt);
}
