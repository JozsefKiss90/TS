/**
 * A rule the framework adds (lesson 0020).
 *
 * Lab 12's interpreter has no step limit: the spec's call cap, ceiling and
 * deadline end a job. LangGraph stops any run after 25 steps unless told
 * otherwise, with a GraphRecursionError. The runner raises the limit so
 * lab 12's tests keep their meaning. This file measures both sides on a
 * toy loop that takes 40 steps.
 */
import { GraphRecursionError } from "@langchain/langgraph";
import { describe, expect, it } from "vitest";
import type { TraceEvent } from "../../07-tool-loop/src/trace.js";
import type { HandlerTable, Position } from "../../12-workflow-graph/src/interpreter.js";
import { admitWorkflowGraph, type WorkflowGraph } from "../../12-workflow-graph/src/workflow-graph.js";
import { orchestrate, runGraph } from "../src/langgraph-runner.js";

type Laps = { laps: number };

function loopGraph(): WorkflowGraph {
  const admission = admitWorkflowGraph({
    name: "loop",
    nodes: ["a", "b", "done"],
    start: "a",
    terminal: ["done"],
    guards: [],
    edges: [
      { from: "a", to: "b" },
      { from: "b", to: "a" },
      { from: "b", to: "done" },
    ],
  });
  if (!admission.admitted) throw new Error(admission.rejections.join("; "));
  return admission.graph;
}

const tick: TraceEvent = { kind: "call_started", at: 1, call: 1 };
const handlers: HandlerTable<Laps, undefined> = {
  a: (s) => Promise.resolve({ to: "b", state: s, event: tick }),
  b: (s) => Promise.resolve({ to: s.laps === 19 ? "done" : "a", state: { laps: s.laps + 1 }, event: tick }),
};
const start: Position<Laps> = { node: "a", step: 0, state: { laps: 0 } };

describe("a run longer than 25 steps", () => {
  it("lands through the runner, which raises the framework's limit", async () => {
    const result = await runGraph(loopGraph(), {}, handlers, start, undefined);
    expect(result).toEqual({ ok: true, node: "done", step: 40, state: { laps: 20 } });
  });

  it("is stopped by the framework's default limit of 25", async () => {
    const run = orchestrate(loopGraph(), {}, handlers, undefined, { recursionLimit: 25 });
    await expect(run.start(start, "loop-1")).rejects.toBeInstanceOf(GraphRecursionError);
  });
});
