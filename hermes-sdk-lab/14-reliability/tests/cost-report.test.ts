/**
 * The cost report (lesson 0022), written before the code.
 *
 * The seam is one pure function: events in, a report out. Every expected
 * number below was worked by hand from the trace lines, so a test that
 * passes is the function agreeing with arithmetic you can redo.
 */
import { describe, expect, it } from "vitest";
import type { TraceEvent } from "../../07-tool-loop/src/trace.js";
import { costReport, type CostReport, type ModelSpan } from "../src/cost-report.js";
import { PRICES } from "../src/prices.js";
import { readRecording, recording, recordingName, RECORDINGS } from "../src/recordings.js";

const OPUS = PRICES["claude-opus-4-8"];

function report(events: TraceEvent[]): CostReport {
  const result = costReport(events, OPUS);
  if (!result.ok) throw new Error(result.reason);
  return result.report;
}

function models(r: CostReport): ModelSpan[] {
  return r.spans.filter((s): s is ModelSpan => s.kind === "model");
}

describe("the sums agree with job_ended", () => {
  it.each(RECORDINGS.map((path) => [recordingName(path), path]))("%s", (_name, path) => {
    const r = report(readRecording(path));
    expect(r.recorded).not.toBeNull();
    expect(r.totals.tokens).toBe(r.recorded?.tokens);
    expect(r.totals.calls).toBe(r.recorded?.calls);
    expect(r.agrees).toBe(true);
  });

  it("refuses to agree when one reply's count is changed", () => {
    const events = recording("audit-atlas.jsonl").map((e) =>
      e.kind === "reply" && e.call === 2 ? { ...e, outputTokens: e.outputTokens + 1 } : e,
    );
    const r = report(events);
    expect(r.totals.tokens).toBe(218);
    expect(r.recorded?.tokens).toBe(217);
    expect(r.agrees).toBe(false);
  });

  it("refuses to agree when a cut-off call would be booked below zero", () => {
    const events = recording("tight-budget.jsonl").map((e) =>
      e.kind === "job_ended" ? { ...e, tokensSpent: 60 } : e,
    );
    const r = report(events);
    expect(r.agrees).toBe(false);
    expect(r.spans.every((s) => s.kind !== "model" || s.microUsd >= 0)).toBe(true);
  });

  it("does not agree with a record that has no job_ended", () => {
    const events = recording("audit-atlas.jsonl").filter((e) => e.kind !== "job_ended");
    const r = report(events);
    expect(r.recorded).toBeNull();
    expect(r.agrees).toBe(false);
  });

  it("refuses a record with no job_started", () => {
    const events = recording("audit-atlas.jsonl").filter((e) => e.kind !== "job_started");
    expect(costReport(events, OPUS)).toEqual({ ok: false, reason: "no job_started: the record cannot say what ran" });
  });
});

describe("one run, span by span", () => {
  it("prices the plain audit call by call", () => {
    const r = report(recording("audit-atlas.jsonl"));
    expect(r.spans.map((s) => `${s.kind}:${s.ms}`)).toEqual(["model:1654", "tool:1", "model:1013"]);

    const [first, second] = models(r);
    expect(first).toMatchObject({ call: 1, inputTokens: 23, outputTokens: 42, tokens: 65, source: "reply", microUsd: 1165 });
    expect(second).toMatchObject({ call: 2, inputTokens: 110, outputTokens: 42, tokens: 152, source: "reply", microUsd: 1600 });
    expect(r.totals).toMatchObject({ calls: 2, tokens: 217, microUsd: 2765 });
    expect(r.wallMs).toBe(2671);
  });

  it("books a cut-off call as the remainder, priced at the output rate", () => {
    const r = report(recording("tight-budget.jsonl"));
    const cut = models(r)[1];
    expect(cut).toMatchObject({ call: 2, tokens: 126, source: "remainder", inputTokens: null, outputTokens: null });
    expect(cut?.microUsd).toBe(126 * 25);
    expect(cut?.ms).toBe(777);
  });

  it("starts a resumed run from what the earlier run carried", () => {
    const r = report(recording("tight-deadline-resume.jsonl"));
    expect(r.carried).toEqual({ calls: 2, tokens: 183 });
    expect(models(r).map((s) => s.call)).toEqual([3]);
    expect(r.totals).toMatchObject({ calls: 3, tokens: 335 });
  });

  it("times the wait for a human apart from the tool's own run", () => {
    const events = recording("parked-audit.jsonl");
    const gate = events.find((e) => e.kind === "gate");
    const approval = events.find((e) => e.kind === "approval");
    const result = events.find((e) => e.kind === "tool_result");
    const tool = report(events).spans.find((s) => s.kind === "tool");
    expect(tool).toMatchObject({ tool: "graph_health", decision: "hold", failed: false });
    expect(tool?.heldMs).toBe((approval?.at ?? 0) - (gate?.at ?? 0));
    expect(tool?.ms).toBe((result?.at ?? 0) - (gate?.at ?? 0));
    expect(tool?.heldMs).toBeGreaterThan(0);
  });
});

describe("two holds on the same tool, in one reply", () => {
  // No recording holds twice, so this record is built by hand. Both gates
  // are written before either verdict, so pairing a result with the last
  // verdict seen would give both tools the second wait.
  const events: TraceEvent[] = [
    { kind: "job_started", at: 0, title: "t", owner: "o", instruction: "i", costCeilingTokens: 2000 },
    { kind: "call_started", at: 0, call: 1 },
    {
      kind: "reply", at: 10, call: 1, stop: "wants_tool", text: "",
      calls: [{ id: "a", name: "graph_health", input: {} }, { id: "b", name: "graph_health", input: {} }],
      inputTokens: 1, outputTokens: 1, requestId: null,
    },
    { kind: "gate", at: 10, call: 1, tool: "graph_health", decision: "hold" },
    { kind: "gate", at: 10, call: 1, tool: "graph_health", decision: "hold" },
    { kind: "approval", at: 110, tool: "graph_health", verdict: "approved" },
    { kind: "approval", at: 1010, tool: "graph_health", verdict: "approved" },
    { kind: "tool_result", at: 1011, id: "a", tool: "graph_health", failed: false, output: "" },
    { kind: "tool_result", at: 1012, id: "b", tool: "graph_health", failed: false, output: "" },
    { kind: "job_ended", at: 1013, outcome: "gave_up", modelCalls: 1, tokensSpent: 2, notes: [] },
  ];

  it("gives each held gate its own verdict's wait", () => {
    const held = report(events).spans.flatMap((s) => (s.kind === "tool" ? [s.heldMs] : []));
    expect(held).toEqual([100, 1000]);
  });
});

describe("the pack's share of every call", () => {
  it("names the pack and estimates its tokens from its characters", () => {
    const r = report(recording("audit-atlas-grounded.jsonl"));
    for (const span of models(r)) {
      expect(span.pack).toEqual({ ids: ["MOD-004", "MOD-006"], chars: 509, tokens: 128 });
    }
  });

  it("lands within two tokens of the paired measurement", () => {
    const grounded = models(report(recording("audit-atlas-grounded.jsonl")));
    const bare = models(report(recording("audit-atlas-bare.jsonl")));
    for (const [i, span] of grounded.entries()) {
      const measured = (span.inputTokens ?? 0) - (bare[i]?.inputTokens ?? 0);
      expect(measured).toBe(129);
      expect(Math.abs((span.pack?.tokens ?? 0) - measured)).toBeLessThanOrEqual(2);
    }
  });

  it("gives a run without a pack no pack share", () => {
    for (const span of models(report(recording("audit-atlas-bare.jsonl")))) expect(span.pack).toBeNull();
  });
});

describe("the 80% alert, placed", () => {
  it("places the tight budget's alert at the call that crossed it", () => {
    const r = report(recording("tight-budget.jsonl"));
    expect(r.alertThreshold).toBe(152);
    expect(r.alert).toEqual({ call: 2, tokensAfter: 191, estimated: true });
    expect(r.alertNoted).toBe(true);
  });

  it.each(RECORDINGS.map((path) => [recordingName(path), path]))(
    "%s: a placed alert if and only if job_ended noted one",
    (_name, path) => {
      const r = report(readRecording(path));
      expect(r.alert !== null).toBe(r.alertNoted);
    },
  );
});
