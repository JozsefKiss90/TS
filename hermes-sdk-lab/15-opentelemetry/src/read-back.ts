/**
 * Read back (lesson 0023): OpenTelemetry spans to lab 14's span shape.
 *
 * The comparison test needs two independent routes to the same objects.
 * Lab 14's costReport is one. This file is the other: it rebuilds each
 * ModelSpan and ToolSpan from nothing but what the exporter holds, so any
 * field the export dropped, rounded or renamed shows up as a difference.
 */
import { SpanKind, SpanStatusCode, type AttributeValue, type HrTime } from "@opentelemetry/api";
import type { ReadableSpan } from "@opentelemetry/sdk-trace";
import type { CostReport, ModelSpan, Span, ToolSpan } from "../../14-reliability/src/cost-report.js";
import { GEN_AI, HERMES } from "./conventions.js";
import { JOB_SPAN_NAME } from "./export-run.js";

/** The job span, read back into lab 14's report fields. */
export interface ReadBackJob {
  title: string;
  ceilingTokens: number;
  carried: CostReport["carried"];
  totals: CostReport["totals"];
  /** job_ended's outcome. Null when the record was cut short. */
  outcome: string | null;
  agrees: boolean;
  /** Read from the one span event named hermes.budget_alert, wherever it sits. */
  alert: CostReport["alert"];
  startedAt: number;
  endedAt: number;
}

export type ReadBackResult = { ok: true; job: ReadBackJob; spans: Span[] } | { ok: false; reason: string };

/** Epoch milliseconds from OpenTelemetry's [seconds, nanoseconds]. Exact for whole milliseconds. */
export function toMs([seconds, nanos]: HrTime): number {
  return seconds * 1000 + nanos / 1_000_000;
}

export function readBack(exported: ReadableSpan[]): ReadBackResult {
  const job = exported.find((s) => s.name === JOB_SPAN_NAME && s.parentSpanContext === undefined);
  if (job === undefined) return { ok: false, reason: `no root span named ${JOB_SPAN_NAME}` };

  try {
    const steps = exported
      .filter((s) => s !== job)
      .map((s) => ({ s, at: toMs(s.startTime) }))
      // Stable: spans that start in the same millisecond keep export order,
      // which is the report's order.
      .sort((a, b) => a.at - b.at)
      .map(({ s }) => (s.kind === SpanKind.CLIENT ? modelSpan(s) : toolSpan(s)));

    const a = job.attributes;
    return {
      ok: true,
      job: {
        title: str(a, HERMES.title),
        ceilingTokens: num(a, HERMES.ceilingTokens),
        carried:
          a[HERMES.carriedCalls] === undefined
            ? null
            : { calls: num(a, HERMES.carriedCalls), tokens: num(a, HERMES.carriedTokens) },
        totals: { calls: num(a, HERMES.totalCalls), tokens: num(a, HERMES.totalTokens), microUsd: num(a, HERMES.totalMicroUsd) },
        outcome: a[HERMES.outcome] === undefined ? null : str(a, HERMES.outcome),
        agrees: a[HERMES.agrees] === true,
        alert: alertFrom(exported),
        startedAt: toMs(job.startTime),
        endedAt: toMs(job.endTime),
      },
      spans: steps,
    };
  } catch (error) {
    return { ok: false, reason: error instanceof Error ? error.message : String(error) };
  }
}

function alertFrom(exported: ReadableSpan[]): CostReport["alert"] {
  for (const s of exported) {
    const event = s.events.find((e) => e.name === HERMES.alert);
    if (event === undefined) continue;
    const a = event.attributes ?? {};
    return { call: num(s.attributes, HERMES.call), tokensAfter: num(a, HERMES.tokensAfter), estimated: a[HERMES.estimated] === true };
  }
  return null;
}

function modelSpan(s: ReadableSpan): ModelSpan {
  const a = s.attributes;
  const packIds = a[HERMES.packIds];
  const source = str(a, HERMES.tokensSource);
  if (source !== "reply" && source !== "remainder") throw new Error(`${s.name}: unknown token source ${source}`);
  return {
    kind: "model",
    call: num(a, HERMES.call),
    startedAt: toMs(s.startTime),
    endedAt: toMs(s.endTime),
    ms: toMs(s.duration),
    inputTokens: optNum(a, GEN_AI.inputTokens),
    outputTokens: optNum(a, GEN_AI.outputTokens),
    tokens: num(a, HERMES.tokens),
    source,
    microUsd: num(a, HERMES.microUsd),
    requestId: a[HERMES.requestId] === undefined ? null : str(a, HERMES.requestId),
    pack:
      packIds === undefined
        ? null
        : { ids: (packIds as string[]).slice(), chars: num(a, HERMES.packChars), tokens: num(a, HERMES.packTokens) },
  };
}

function toolSpan(s: ReadableSpan): ToolSpan {
  const a = s.attributes;
  const decision = str(a, HERMES.decision);
  if (decision !== "not_permitted" && decision !== "auto" && decision !== "hold") {
    throw new Error(`${s.name}: unknown gate decision ${decision}`);
  }
  return {
    kind: "tool",
    tool: str(a, GEN_AI.toolName),
    id: str(a, GEN_AI.toolCallId),
    call: num(a, HERMES.call),
    decision,
    startedAt: toMs(s.startTime),
    endedAt: toMs(s.endTime),
    ms: toMs(s.duration),
    heldMs: optNum(a, HERMES.heldMs),
    failed: s.status.code === SpanStatusCode.ERROR,
  };
}

type Attrs = Record<string, AttributeValue | undefined>;

function num(a: Attrs, key: string): number {
  const v = a[key];
  if (typeof v !== "number") throw new Error(`attribute ${key} is not a number`);
  return v;
}

function optNum(a: Attrs, key: string): number | null {
  return a[key] === undefined ? null : num(a, key);
}

function str(a: Attrs, key: string): string {
  const v = a[key];
  if (typeof v !== "string") throw new Error(`attribute ${key} is not a string`);
  return v;
}
