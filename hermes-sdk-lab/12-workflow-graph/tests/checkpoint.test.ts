/**
 * The checkpoint, written before the schema that admits it (lesson 0018).
 *
 * A checkpoint is the state the interpreter carries plus the node the run
 * is about to enter. It is read back from disk, so it is a JSON boundary
 * and is parsed, never cast. It holds no event: a trace line in a
 * checkpoint is refused at the root, the way a claim is refused in the
 * graph file.
 */
import { describe, expect, it } from "vitest";
import { admitCheckpoint } from "../src/checkpoint.js";
import { initialState } from "../src/job-state.js";
import { spec } from "./helpers.js";

function candidate(): Record<string, unknown> {
  return { job: "Audit the atlas graph", step: 3, node: "gating", state: initialState(spec()) };
}

describe("admitting a checkpoint", () => {
  it("admits a fresh state at the start node and keeps its fields", () => {
    const admission = admitCheckpoint({ ...candidate(), step: 0, node: "started" });
    expect(admission.admitted).toBe(true);
    if (!admission.admitted) return;
    expect(admission.checkpoint.node).toBe("started");
    expect(admission.checkpoint.state.transcript).toEqual([
      { from: "operator", text: spec().instruction },
    ]);
    expect(admission.checkpoint.state.modelCalls).toBe(0);
  });

  it("admits a state mid-run, with a pending tool call and a gate decision", () => {
    const state = initialState(spec());
    const mid = {
      ...state,
      modelCalls: 1,
      tokensSpent: 30,
      transcript: [
        ...state.transcript,
        {
          from: "model",
          text: "I need the graph health report first.",
          calls: [{ id: "toolu_1", name: "graph_health", input: { graph: "atlas" } }],
        },
      ],
      pending: [{ id: "toolu_1", name: "graph_health", input: { graph: "atlas" } }],
      gate: "hold",
    };
    const admission = admitCheckpoint({ ...candidate(), node: "awaiting_approval", state: mid });
    expect(admission.admitted).toBe(true);
    if (!admission.admitted) return;
    expect(admission.checkpoint.state.pending).toHaveLength(1);
    expect(admission.checkpoint.state.gate).toBe("hold");
  });

  it("refuses an events key at the root: a checkpoint is not a trace", () => {
    const admission = admitCheckpoint({ ...candidate(), events: [{ kind: "job_started" }] });
    expect(admission.admitted).toBe(false);
    if (admission.admitted) return;
    expect(admission.rejections.join(" ")).toContain("events");
  });

  it("refuses a transcript turn from nobody the port knows", () => {
    const state = initialState(spec());
    const bad = { ...state, transcript: [{ from: "provider", text: "hello" }] };
    const admission = admitCheckpoint({ ...candidate(), state: bad });
    expect(admission.admitted).toBe(false);
    if (admission.admitted) return;
    expect(admission.rejections.join(" ")).toContain("transcript");
  });

  it("refuses a step that is not a whole number of steps", () => {
    const admission = admitCheckpoint({ ...candidate(), step: -1 });
    expect(admission.admitted).toBe(false);
  });
});
