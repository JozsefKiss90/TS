/**
 * The same spans through OpenTelemetry JS (lesson 0023), written before the code.
 *
 * The seam is one function: events in, OpenTelemetry spans out through a
 * tracer, and lab 14's report back as the result. The claim under test is
 * that the library adds ids, parent links and an export format, and loses
 * nothing: every span read back from the in-memory exporter equals lab 14's
 * hand-computed span, field for field, on all seven recorded runs.
 */
import { SpanKind, SpanStatusCode, trace } from "@opentelemetry/api";
import type { ReadableSpan } from "@opentelemetry/sdk-trace";
import { afterEach, describe, expect, it } from "vitest";
import type { TraceEvent } from "../../07-tool-loop/src/trace.js";
import { costReport, type CostReport } from "../../14-reliability/src/cost-report.js";
import { PRICES } from "../../14-reliability/src/prices.js";
import { readRecording, recording, recordingName, RECORDINGS } from "../../14-reliability/src/recordings.js";
import { exportRun } from "../src/export-run.js";
import { readBack } from "../src/read-back.js";
import { inMemoryTelemetry, otlpJson, type Telemetry } from "../src/telemetry.js";

const OPUS = PRICES["claude-opus-4-8"];

let open: Telemetry[] = [];
afterEach(async () => {
  await Promise.all(open.map((t) => t.shutdown()));
  open = [];
});

function telemetry(): Telemetry {
  const t = inMemoryTelemetry();
  open.push(t);
  return t;
}

/** Runs one trace through the exporter and returns both sides. */
function both(events: TraceEvent[]): { report: CostReport; exported: ReadableSpan[] } {
  const t = telemetry();
  const result = exportRun(events, OPUS, t.tracer);
  if (!result.ok) throw new Error(result.reason);
  return { report: result.report, exported: t.exporter.getFinishedSpans() };
}

function named(exported: ReadableSpan[], name: string): ReadableSpan {
  const span = exported.find((s) => s.name === name);
  if (span === undefined) throw new Error(`no span named ${name}`);
  return span;
}

describe("read back from the exporter, the spans equal lab 14's", () => {
  it.each(RECORDINGS.map((path) => [recordingName(path), path]))("%s", (_name, path) => {
    const events = readRecording(path);
    const { exported } = both(events);
    const hand = costReport(events, OPUS);
    if (!hand.ok) throw new Error(hand.reason);

    const back = readBack(exported);
    if (!back.ok) throw new Error(back.reason);
    expect(back.spans).toEqual(hand.report.spans);
    const r = hand.report;
    expect(back.job).toEqual({
      title: r.title,
      ceilingTokens: r.ceilingTokens,
      carried: r.carried,
      totals: r.totals,
      outcome: r.recorded?.outcome ?? null,
      agrees: r.agrees,
      alert: r.alert,
      startedAt: back.job.endedAt - (r.wallMs ?? 0),
      endedAt: back.job.endedAt,
    });
  });
});

describe("the library adds ids and parent links", () => {
  it.each(RECORDINGS.map((path) => [recordingName(path), path]))("%s: one trace, one root", (_name, path) => {
    const { report, exported } = both(readRecording(path));
    expect(exported).toHaveLength(report.spans.length + 1);

    const roots = exported.filter((s) => s.parentSpanContext === undefined);
    expect(roots).toHaveLength(1);
    const root = roots[0]!;
    const traceIds = new Set(exported.map((s) => s.spanContext().traceId));
    expect(traceIds.size).toBe(1);
    expect(root.spanContext().traceId).toMatch(/^[0-9a-f]{32}$/);
    expect(root.spanContext().spanId).toMatch(/^[0-9a-f]{16}$/);

    for (const child of exported.filter((s) => s !== root)) {
      expect(child.parentSpanContext?.spanId).toBe(root.spanContext().spanId);
    }
  });

  it("gives every export a fresh trace id, so ids are not part of the record", () => {
    const events = recording("audit-atlas.jsonl");
    const first = both(events).exported[0]!.spanContext().traceId;
    const second = both(events).exported[0]!.spanContext().traceId;
    expect(first).not.toBe(second);
  });
});

describe("the job span covers job_started to job_ended", () => {
  it("audit-atlas: 2,671 ms, the report's totals as attributes", () => {
    const events = recording("audit-atlas.jsonl");
    const { report, exported } = both(events);
    const root = named(exported, "invoke_workflow hermes_job");
    const started = events.find((e) => e.kind === "job_started")!;
    const ended = events.find((e) => e.kind === "job_ended")!;

    const back = readBack(exported);
    if (!back.ok) throw new Error(back.reason);
    expect(back.job.startedAt).toBe(started.at);
    expect(back.job.endedAt).toBe(ended.at);
    expect(back.job.endedAt - back.job.startedAt).toBe(2671);
    expect(root.kind).toBe(SpanKind.INTERNAL);
    expect(root.attributes["hermes.totals.micro_usd"]).toBe(report.totals.microUsd);
    expect(root.attributes["hermes.outcome"]).toBe("landed");
  });
});

describe("GenAI attribute names, where a convention exists", () => {
  it("a model call is a CLIENT span named after the operation and the model", () => {
    const { exported } = both(recording("audit-atlas.jsonl"));
    const call1 = exported.find((s) => s.attributes["hermes.call"] === 1 && s.kind === SpanKind.CLIENT)!;
    expect(call1.name).toBe("chat claude-opus-4-8");
    expect(call1.attributes["gen_ai.operation.name"]).toBe("chat");
    expect(call1.attributes["gen_ai.provider.name"]).toBe("anthropic");
    expect(call1.attributes["gen_ai.request.model"]).toBe("claude-opus-4-8");
    expect(call1.attributes["gen_ai.usage.input_tokens"]).toBe(23);
    expect(call1.attributes["gen_ai.usage.output_tokens"]).toBe(42);
    expect(call1.attributes["hermes.cost.micro_usd"]).toBe(1165);
  });

  it("a cut-off call carries no usage attributes, only the remainder and its source", () => {
    const { exported } = both(recording("tight-budget.jsonl"));
    const call2 = exported.find((s) => s.attributes["hermes.call"] === 2 && s.kind === SpanKind.CLIENT)!;
    expect(call2.attributes["gen_ai.usage.input_tokens"]).toBeUndefined();
    expect(call2.attributes["gen_ai.usage.output_tokens"]).toBeUndefined();
    expect(call2.attributes["hermes.tokens"]).toBe(126);
    expect(call2.attributes["hermes.tokens.source"]).toBe("remainder");
  });

  it("a tool run is an INTERNAL span with the tool's name and the model's call id", () => {
    const { report, exported } = both(recording("parked-audit.jsonl"));
    const tool = named(exported, "execute_tool graph_health");
    const hand = report.spans.find((s) => s.kind === "tool");
    if (hand?.kind !== "tool") throw new Error("the parked audit has no tool span");
    expect(tool.kind).toBe(SpanKind.INTERNAL);
    expect(tool.attributes["gen_ai.operation.name"]).toBe("execute_tool");
    expect(tool.attributes["gen_ai.tool.name"]).toBe("graph_health");
    expect(tool.attributes["gen_ai.tool.call.id"]).toBe(hand.id);
    expect(tool.attributes["hermes.gate.decision"]).toBe("hold");
    expect(tool.attributes["hermes.held_ms"]).toBe(hand.heldMs);
    expect(tool.status.code).toBe(SpanStatusCode.UNSET);
  });
});

describe("the 80% alert becomes a span event", () => {
  it("tight-budget: on call 2's span, at its end, marked estimated", () => {
    const { exported } = both(recording("tight-budget.jsonl"));
    const call2 = exported.find((s) => s.attributes["hermes.call"] === 2 && s.kind === SpanKind.CLIENT)!;
    expect(call2.events).toHaveLength(1);
    const event = call2.events[0]!;
    expect(event.name).toBe("hermes.budget_alert");
    expect(event.time).toEqual(call2.endTime);
    expect(event.attributes?.["hermes.tokens_after"]).toBe(191);
    expect(event.attributes?.["hermes.estimated"]).toBe(true);
  });

  it("audit-atlas: no alert, so no event on any span", () => {
    const { exported } = both(recording("audit-atlas.jsonl"));
    expect(exported.flatMap((s) => s.events)).toHaveLength(0);
  });
});

describe("what the library does not decide", () => {
  it("a record the report refuses exports nothing", () => {
    const t = telemetry();
    const events = recording("audit-atlas.jsonl").filter((e) => e.kind !== "job_started");
    const result = exportRun(events, OPUS, t.tracer);
    expect(result.ok).toBe(false);
    expect(t.exporter.getFinishedSpans()).toHaveLength(0);
  });

  it("with no SDK registered, the API's tracer records nothing and the run still reports", () => {
    const tracer = trace.getTracer("hermes");
    const result = exportRun(recording("audit-atlas.jsonl"), OPUS, tracer);
    expect(result.ok).toBe(true);
    expect(tracer.startSpan("probe").spanContext().spanId).toBe("0000000000000000");
  });

  it("a span started at a recorded time and ended with no time ends now, not when the step ended", () => {
    const t = telemetry();
    const recorded = recording("audit-atlas.jsonl")[0]!.at;
    t.tracer.startSpan("probe", { startTime: recorded }).end();
    const [probe] = t.exporter.getFinishedSpans();
    const ms = probe!.duration[0] * 1000 + probe!.duration[1] / 1e6;
    expect(ms).toBeGreaterThan(Date.now() - recorded - 60_000);
  });
});

describe("the OTLP JSON body, built offline", () => {
  it("audit-atlas: four spans, ids in hex, times in nanoseconds since the epoch", () => {
    const events = recording("audit-atlas.jsonl");
    const { exported } = both(events);
    const body = otlpJson(exported) as {
      resourceSpans: { scopeSpans: { scope: { name: string }; spans: Record<string, unknown>[] }[] }[];
    };
    const spans = body.resourceSpans[0]!.scopeSpans[0]!.spans;
    expect(body.resourceSpans[0]!.scopeSpans[0]!.scope.name).toBe("hermes");
    expect(spans).toHaveLength(4);
    const root = spans.find((s) => s["name"] === "invoke_workflow hermes_job")!;
    const started = events.find((e) => e.kind === "job_started")!;
    expect(root["traceId"]).toMatch(/^[0-9a-f]{32}$/);
    expect(String(root["startTimeUnixNano"])).toBe(`${started.at}000000`);
  });

  it("names the service hermes, not the default built from the Node binary's path", () => {
    const { exported } = both(recording("audit-atlas.jsonl"));
    const body = otlpJson(exported) as {
      resourceSpans: { resource: { attributes: { key: string; value: { stringValue?: string } }[] } }[];
    };
    const service = body.resourceSpans[0]!.resource.attributes.find((a) => a.key === "service.name");
    expect(service?.value.stringValue).toBe("hermes");
  });
});
