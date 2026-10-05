/**
 * The WALKER — replays a trace against a workflow graph (lesson 0017).
 *
 * The trace says what happened, one event per line. The graph says what
 * may happen, one edge per allowed move. This file is the only code that
 * reads both. It keeps the current node and the path taken, and no event.
 *
 * Each event enters one node. `nodeFor` is that mapping, and it is the one
 * place the trace vocabulary and the node names meet. For every pair of
 * consecutive events the walker asks: does the graph hold an edge from the
 * node I am in to the node this event enters? If the edge carries a guard,
 * the guard reads the event being left and says yes or no.
 *
 * Zero model calls. A recording is enough, and so is a run through the
 * real supervisor against a fake gateway.
 */
import type { TraceEvent } from "../../07-tool-loop/src/trace.js";
import type { WorkflowGraph } from "./workflow-graph.js";

/**
 * A guard is a predicate over the event being left: the one that put the
 * run in the node it is now leaving. That event is what decided the branch
 * in supervisor.ts, so it is all a guard needs.
 */
export type Guard = (leaving: TraceEvent) => boolean;

/** Guard implementations, keyed by the names the graph declares. */
export type GuardTable = Record<string, Guard>;

/** The node one trace event enters. `job_ended` enters its outcome. */
export function nodeFor(event: TraceEvent): string {
  switch (event.kind) {
    case "job_started":
      return "started";
    case "evidence_used":
      return "grounded";
    case "call_started":
      return "calling";
    case "reply":
      return "replied";
    case "gate":
      return "gating";
    case "approval":
      return "awaiting_approval";
    case "tool_result":
      return "tool_ran";
    case "job_ended":
      return event.outcome;
  }
}

export type Walk =
  | {
      ok: true;
      /** The nodes entered, in order, starting at the start node. */
      path: string[];
      /** True when the last node is terminal. A cut-short trace is legal and incomplete. */
      complete: boolean;
      /** Each edge taken, as "from>to", so coverage can be counted. */
      edgesTaken: string[];
    }
  | {
      ok: false;
      /** The trace line that made the illegal move. 0 means before any line. */
      line: number;
      from: string;
      to: string;
      reason: string;
    };

export function walk(graph: WorkflowGraph, guards: GuardTable, events: TraceEvent[]): Walk {
  // A graph may only cite guards this table can run. Checked before any
  // event, so a missing implementation is a wiring fault, not a trace fault.
  for (const name of graph.guards) {
    if (!(name in guards)) {
      return { ok: false, line: 0, from: "", to: "", reason: `guard "${name}" has no implementation` };
    }
  }

  const first = events[0];
  if (first === undefined) {
    return { ok: false, line: 0, from: "", to: "", reason: "an empty trace enters no node" };
  }
  const entry = nodeFor(first);
  if (entry !== graph.start) {
    return {
      ok: false,
      line: 1,
      from: "",
      to: entry,
      reason: `a run must begin at the start node "${graph.start}"`,
    };
  }

  const path = [entry];
  const edgesTaken: string[] = [];
  let current = entry;

  for (let i = 1; i < events.length; i++) {
    const leaving = events[i - 1];
    const entering = events[i];
    if (leaving === undefined || entering === undefined) break;
    const next = nodeFor(entering);
    const line = i + 1;

    const candidates = graph.edges.filter((e) => e.from === current && e.to === next);
    if (candidates.length === 0) {
      return { ok: false, line, from: current, to: next, reason: `no edge ${current} > ${next}` };
    }

    // An unguarded edge is always open. A guarded one asks its guard.
    const open = candidates.find((e) => e.guard === undefined || guards[e.guard]?.(leaving));
    if (open === undefined) {
      const named = candidates.map((e) => e.guard).filter((g): g is string => g !== undefined);
      return {
        ok: false,
        line,
        from: current,
        to: next,
        reason: `guard refused the move: ${named.join(", ")}`,
      };
    }

    edgesTaken.push(`${current}>${next}`);
    path.push(next);
    current = next;
  }

  return { ok: true, path, complete: graph.terminal.includes(current), edgesTaken };
}
