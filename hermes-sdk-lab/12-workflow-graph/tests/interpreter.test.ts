/**
 * The interpreter, written before it exists (lesson 0018). It runs one
 * node's handler, asks the graph whether the move the handler wants is
 * allowed, writes a checkpoint, and moves. An edge the graph does not hold
 * is a typed refusal, not an exception, and no checkpoint is written for
 * a move that did not happen.
 *
 * The handlers here are toys: the state is a list of the nodes visited.
 * The real handlers are tested in graph-run.test.ts.
 */
import { describe, expect, it } from "vitest";
import type { TraceEvent } from "../../07-tool-loop/src/trace.js";
import { runGraph, type HandlerTable, type Position } from "../src/interpreter.js";
import type { GuardTable } from "../src/walker.js";
import { admitWorkflowGraph, type WorkflowGraph } from "../src/workflow-graph.js";
import { keeper, smallGraph } from "./helpers.js";

type Visits = { visited: string[] };

function graph(raw: Record<string, unknown> = smallGraph()): WorkflowGraph {
  const admission = admitWorkflowGraph(raw);
  if (!admission.admitted) throw new Error(admission.rejections.join("; "));
  return admission.graph;
}

const tick: TraceEvent = { kind: "call_started", at: 1, call: 1 };

/** Each handler notes its node and asks for the node named for it. */
function handlers(next: Record<string, string>): HandlerTable<Visits, undefined> {
  const table: HandlerTable<Visits, undefined> = {};
  for (const [node, to] of Object.entries(next)) {
    table[node] = (state) =>
      Promise.resolve({ to, state: { visited: [...state.visited, node] }, event: tick });
  }
  return table;
}

const always: GuardTable = { always: () => true };
const start: Position<Visits> = { node: "started", step: 0, state: { visited: [] } };

describe("running a graph one step at a time", () => {
  it("runs each node's handler and stops at a terminal node", async () => {
    const result = await runGraph(
      graph(),
      always,
      handlers({ started: "calling", calling: "landed" }),
      start,
      undefined,
    );
    expect(result).toEqual({
      ok: true,
      node: "landed",
      step: 2,
      state: { visited: ["started", "calling"] },
    });
  });

  it("writes one checkpoint per step, naming the node the run enters next", async () => {
    const { port, saved } = keeper<Visits>();
    await runGraph(
      graph(),
      always,
      handlers({ started: "calling", calling: "landed" }),
      start,
      undefined,
      { job: "toy", checkpoints: port },
    );
    expect(saved.map((c) => [c.step, c.node])).toEqual([
      [1, "calling"],
      [2, "landed"],
    ]);
    expect(saved[1]?.state).toEqual({ visited: ["started", "calling"] });
  });

  it("refuses a move the graph has no edge for, before it happens", async () => {
    const { port, saved } = keeper<Visits>();
    const result = await runGraph(
      graph(),
      always,
      handlers({ started: "landed", calling: "landed" }),
      start,
      undefined,
      { job: "toy", checkpoints: port },
    );
    expect(result).toEqual({ ok: false, kind: "no_edge", step: 1, from: "started", to: "landed" });
    expect(saved).toHaveLength(0);
  });

  it("refuses a move whose guard says no, and names the guard", async () => {
    const never: GuardTable = { always: () => false };
    const result = await runGraph(
      graph(),
      never,
      handlers({ started: "calling", calling: "landed" }),
      start,
      undefined,
    );
    expect(result).toEqual({
      ok: false,
      kind: "guard_refused",
      step: 2,
      from: "calling",
      to: "landed",
      guards: ["always"],
    });
  });

  it("resumes from a position and runs only the steps that remain", async () => {
    const seen: string[] = [];
    const table = handlers({ started: "calling", calling: "landed" });
    const spying: HandlerTable<Visits, undefined> = {};
    for (const [node, handler] of Object.entries(table)) {
      spying[node] = (state, ctx) => {
        seen.push(node);
        return handler(state, ctx);
      };
    }
    const result = await runGraph(
      graph(),
      always,
      spying,
      { node: "calling", step: 1, state: { visited: ["started"] } },
      undefined,
    );
    expect(seen).toEqual(["calling"]);
    expect(result).toMatchObject({ ok: true, node: "landed", step: 2 });
  });

  it("ends at once when the position is already a terminal node", async () => {
    const result = await runGraph(
      graph(),
      always,
      handlers({ started: "calling", calling: "landed" }),
      { node: "landed", step: 2, state: { visited: ["started", "calling"] } },
      undefined,
    );
    expect(result).toMatchObject({ ok: true, node: "landed", step: 2 });
  });

  it("refuses to start when a guard or a handler is missing, before any handler runs", async () => {
    await expect(
      runGraph(graph(), {}, handlers({ started: "calling", calling: "landed" }), start, undefined),
    ).rejects.toThrow(/guard "always"/);
    await expect(
      runGraph(graph(), always, handlers({ started: "calling" }), start, undefined),
    ).rejects.toThrow(/handler/);
  });
});
