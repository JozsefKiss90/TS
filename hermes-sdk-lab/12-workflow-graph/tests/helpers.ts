/**
 * Shared by the lesson-0017 suites: a small legal graph, and a trace
 * collector so a run through the real supervisor can be walked in memory.
 * The admitted spec is lab 11's helper, re-exported, not a copy of it.
 */
import type { TraceEvent, TracePort } from "../../07-tool-loop/src/trace.js";

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
