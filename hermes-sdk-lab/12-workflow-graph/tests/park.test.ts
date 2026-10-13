/**
 * A handler's second answer, written before it exists (lesson 0019).
 *
 * A move is `{ to, state, event }`. A park is `{ park: true }`: the run
 * stops at the node whose handler just ran, and nothing else happens.
 * No edge is asked for, no event is recorded, no checkpoint is written,
 * because the last one already names this node. The result is typed, the
 * way a refusal is, and the process is free to exit.
 *
 * The handlers here are toys, as in interpreter.test.ts.
 */
import { describe, expect, it } from "vitest";
import type { TraceEvent } from "../../07-tool-loop/src/trace.js";
import { runGraph, type HandlerTable, type Position } from "../src/interpreter.js";
import type { GuardTable } from "../src/walker.js";
import { admitWorkflowGraph, type WorkflowGraph } from "../src/workflow-graph.js";
import { keeper, smallGraph } from "./helpers.js";

type Visits = { visited: string[] };

function graph(): WorkflowGraph {
  const admission = admitWorkflowGraph(smallGraph());
  if (!admission.admitted) throw new Error(admission.rejections.join("; "));
  return admission.graph;
}

const tick: TraceEvent = { kind: "call_started", at: 1, call: 1 };
const always: GuardTable = { always: () => true };
const start: Position<Visits> = { node: "started", step: 0, state: { visited: [] } };

/** `started` moves on. `calling` parks until told otherwise. */
function handlers(callingParks: boolean): HandlerTable<Visits, undefined> {
  return {
    started: (state) =>
      Promise.resolve({ to: "calling", state: { visited: [...state.visited, "started"] }, event: tick }),
    calling: (state) =>
      Promise.resolve(
        callingParks
          ? { park: true }
          : { to: "landed", state: { visited: [...state.visited, "calling"] }, event: tick },
      ),
  };
}

describe("a handler that parks", () => {
  it("stops the run at its node with a typed result, and the last checkpoint stands", async () => {
    const { port, saved } = keeper<Visits>();
    const result = await runGraph(graph(), always, handlers(true), start, undefined, {
      job: "toy",
      checkpoints: port,
    });
    expect(result).toEqual({
      ok: false,
      kind: "parked",
      step: 1,
      node: "calling",
      state: { visited: ["started"] },
    });
    // One checkpoint, for the one move made. None for the park.
    expect(saved.map((c) => [c.step, c.node])).toEqual([[1, "calling"]]);
  });

  it("resumes from the parked position and continues the step count", async () => {
    const { port, saved } = keeper<Visits>();
    const parked = await runGraph(graph(), always, handlers(true), start, undefined, {
      job: "toy",
      checkpoints: port,
    });
    if (parked.ok || parked.kind !== "parked") throw new Error("expected a park");

    const result = await runGraph(graph(), always, handlers(false), parked, undefined, {
      job: "toy",
      checkpoints: port,
    });
    expect(result).toEqual({
      ok: true,
      node: "landed",
      step: 2,
      state: { visited: ["started", "calling"] },
    });
    expect(saved.map((c) => [c.step, c.node])).toEqual([
      [1, "calling"],
      [2, "landed"],
    ]);
  });

  it("parks again when resumed and still told to park: no new checkpoint", async () => {
    const { port, saved } = keeper<Visits>();
    const first = await runGraph(graph(), always, handlers(true), start, undefined, {
      checkpoints: port,
    });
    if (first.ok || first.kind !== "parked") throw new Error("expected a park");
    const second = await runGraph(graph(), always, handlers(true), first, undefined, {
      checkpoints: port,
    });
    expect(second).toEqual(first);
    expect(saved).toHaveLength(1);
  });
});
