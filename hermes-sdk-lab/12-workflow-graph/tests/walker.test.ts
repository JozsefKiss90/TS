/**
 * The walker, written before it exists (lesson 0017). It reads a trace one
 * event at a time, names the node each event enters, and asks the graph
 * whether that move is allowed. It holds no state beyond the current node.
 */
import { describe, expect, it } from "vitest";
import type { TraceEvent } from "../../07-tool-loop/src/trace.js";
import { admitWorkflowGraph, type WorkflowGraph } from "../src/workflow-graph.js";
import { nodeFor, walk, type GuardTable } from "../src/walker.js";
import { smallGraph } from "./helpers.js";

function graph(raw: Record<string, unknown> = smallGraph()): WorkflowGraph {
  const admission = admitWorkflowGraph(raw);
  if (!admission.admitted) throw new Error(admission.rejections.join("; "));
  return admission.graph;
}

const started: TraceEvent = {
  kind: "job_started",
  at: 1,
  title: "t",
  owner: "o",
  instruction: "i",
  costCeilingTokens: 100,
};
const calling: TraceEvent = { kind: "call_started", at: 2, call: 1 };
const landed: TraceEvent = {
  kind: "job_ended",
  at: 3,
  outcome: "landed",
  modelCalls: 1,
  tokensSpent: 10,
  notes: [],
};
const replied = (stop: "completed" | "wants_tool"): TraceEvent => ({
  kind: "reply",
  at: 2,
  call: 1,
  stop,
  text: "",
  calls: [],
  inputTokens: 1,
  outputTokens: 1,
  requestId: null,
});

const always: GuardTable = { always: () => true };
const never: GuardTable = { always: () => false };

describe("naming the node an event enters", () => {
  it("maps each event kind to one node, and job_ended to its outcome", () => {
    expect(nodeFor(started)).toBe("started");
    expect(nodeFor(calling)).toBe("calling");
    expect(nodeFor(replied("completed"))).toBe("replied");
    expect(nodeFor(landed)).toBe("landed");
    expect(nodeFor({ ...landed, outcome: "over_budget" })).toBe("over_budget");
  });
});

describe("walking a run against the graph", () => {
  it("accepts a run that takes only edges the graph holds", () => {
    const result = walk(graph(), always, [started, calling, landed]);
    expect(result).toEqual({
      ok: true,
      path: ["started", "calling", "landed"],
      complete: true,
      edgesTaken: ["started>calling", "calling>landed"],
    });
  });

  it("refuses a move the graph has no edge for, and names the line", () => {
    const result = walk(graph(), always, [started, landed]);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.line).toBe(2);
    expect(result.from).toBe("started");
    expect(result.to).toBe("landed");
    expect(result.reason).toContain("no edge");
  });

  it("refuses a move whose guard says no, and names the guard", () => {
    const result = walk(graph(), never, [started, calling, landed]);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.line).toBe(3);
    expect(result.reason).toContain("always");
  });

  it("refuses a run that does not begin at the start node", () => {
    const result = walk(graph(), always, [calling, landed]);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.line).toBe(1);
    expect(result.reason).toContain("start");
  });

  it("reports a run that stops short of a terminal node as incomplete", () => {
    const result = walk(graph(), always, [started, calling]);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.complete).toBe(false);
  });

  it("refuses a graph that names a guard the table cannot run", () => {
    const result = walk(graph(), {}, [started, calling, landed]);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.line).toBe(0);
    expect(result.reason).toContain("always");
  });

  it("lets a guard choose between two edges from one node", () => {
    const forked = graph({
      name: "fork",
      nodes: ["started", "calling", "replied", "gating", "landed"],
      start: "started",
      terminal: ["landed"],
      guards: ["reply_wants_tool", "reply_finished"],
      edges: [
        { from: "started", to: "calling" },
        { from: "calling", to: "replied" },
        { from: "replied", to: "landed", guard: "reply_finished" },
        { from: "replied", to: "gating", guard: "reply_wants_tool" },
      ],
    });
    const guards: GuardTable = {
      reply_wants_tool: (leaving) => leaving.kind === "reply" && leaving.stop === "wants_tool",
      reply_finished: (leaving) => leaving.kind === "reply" && leaving.stop !== "wants_tool",
    };
    const fine = walk(forked, guards, [started, calling, replied("completed"), landed]);
    expect(fine.ok).toBe(true);

    const wrong = walk(forked, guards, [started, calling, replied("wants_tool"), landed]);
    expect(wrong.ok).toBe(false);
    if (wrong.ok) return;
    expect(wrong.reason).toContain("reply_finished");
  });
});
