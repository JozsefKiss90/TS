/**
 * Shared by the lesson-0017 and 0018 suites: a small legal graph, a trace
 * collector so a run through the real supervisor can be walked in memory,
 * and a checkpoint keeper so a resume can start from the last one saved.
 * The admitted spec is lab 11's helper, re-exported, not a copy of it.
 */
import type { TraceEvent, TracePort } from "../../07-tool-loop/src/trace.js";
import type { Checkpoint, CheckpointPort } from "../src/interpreter.js";
import type { JobState } from "../src/job-state.js";

export { spec } from "../../11-evidence-in-the-loop/tests/helpers.js";

/** A three-node graph with one guarded edge: enough to exercise every rule. */
export function smallGraph(): Record<string, unknown> {
  return {
    name: "small",
    nodes: ["started", "calling", "landed"],
    start: "started",
    terminal: ["landed"],
    guards: ["always"],
    edges: [
      { from: "started", to: "calling" },
      { from: "calling", to: "landed", guard: "always" },
    ],
  };
}

/** A trace sink that keeps every event in order, for the walker to read. */
export function collector(): { port: TracePort; events: TraceEvent[] } {
  const events: TraceEvent[] = [];
  return { port: { append: (event) => void events.push(event) }, events };
}

/**
 * A checkpoint sink that keeps every save, copied. The interpreter hands
 * over the state object it still holds, so keeping the reference would
 * keep an alias that later steps mutate, the same aliasing the fake
 * gateway's transcript snapshot guards against.
 */
export function keeper<S = JobState>(): {
  port: CheckpointPort<S>;
  saved: Checkpoint<S>[];
  latest: () => Checkpoint<S> | undefined;
} {
  const saved: Checkpoint<S>[] = [];
  return {
    port: { save: (checkpoint) => void saved.push(structuredClone(checkpoint)) },
    saved,
    latest: () => saved[saved.length - 1],
  };
}
