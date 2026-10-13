/**
 * The INTERPRETER — the graph advances the loop (lesson 0018).
 *
 * Lesson 0017's walker reads a trace after the run and asks, for each
 * pair of events, whether the graph holds an edge between the nodes they
 * enter. This file asks the same question BEFORE each move. One step is:
 *
 *   1. run the handler of the current node, which does that node's work,
 *      records its event, and names the node it wants next;
 *   2. ask the graph for an open edge from here to there, the way the
 *      walker does, with the guard reading the event just recorded;
 *   3. if there is none, stop with a typed refusal: no checkpoint, no move;
 *   4. write a checkpoint holding the state and the node entered next;
 *   5. move. A terminal node ends the run.
 *
 * Lesson 0019 adds a second result a handler may return: a park. The run
 * stops at the handler's node with a typed result and the last checkpoint
 * standing. Nothing is recorded for a park. It is not a move.
 *
 * Nothing here knows what a job is. The state type and the context type
 * are parameters, and the node names are whatever the graph declares. The
 * job lifecycle's handlers live in handlers.ts.
 *
 * What a refusal costs: nothing after the handler that asked for it. The
 * move is never made, no checkpoint records it, and the last checkpoint
 * still names the node whose handler just ran. A refused run leaves a
 * trace with no job_ended, which lesson 0011 already reads as a record cut
 * short.
 */
import type { TraceEvent } from "../../07-tool-loop/src/trace.js";
import { findOpenEdge, type GuardTable } from "./walker.js";
import type { WorkflowGraph } from "./workflow-graph.js";

/** A move: the node the handler wants next, the state after its work, the event it recorded. */
export interface Move<S> {
  to: string;
  state: S;
  event: TraceEvent;
}

/**
 * A park (lesson 0019): the run stops at this node and the process may
 * exit. No edge is asked for, no event is recorded, no checkpoint is
 * written, because the last one already names this node. The run resumes
 * from that checkpoint, and this node's handler runs again.
 */
export interface Park {
  park: true;
}

/** What one handler returns: a move, or a park. */
export type Step<S> = Move<S> | Park;

/** The work of one node. It never decides whether the move is allowed; the graph does. */
export type NodeHandler<S, C> = (state: S, ctx: C) => Promise<Step<S>>;

/** Handlers keyed by node name. Terminal nodes have none: reaching one ends the run. */
export type HandlerTable<S, C> = Record<string, NodeHandler<S, C>>;

/** Where a run is: the node it enters next, how many steps it has taken, and its state. */
export interface Position<S> {
  node: string;
  step: number;
  state: S;
}

/** A position with the job it belongs to. What the checkpoint port receives after every step. */
export interface Checkpoint<S> extends Position<S> {
  job: string;
}

export interface CheckpointPort<S> {
  save(checkpoint: Checkpoint<S>): void;
}

export type Refusal =
  | { ok: false; kind: "no_edge"; step: number; from: string; to: string }
  | { ok: false; kind: "guard_refused"; step: number; from: string; to: string; guards: string[] };

/** The run stopped at a node without ending: a handler parked it. */
export type Parked<S> = { ok: false; kind: "parked" } & Position<S>;

export type RunOutcome<S> = { ok: true; node: string; step: number; state: S } | Refusal | Parked<S>;

export async function runGraph<S, C>(
  graph: WorkflowGraph,
  guards: GuardTable,
  handlers: HandlerTable<S, C>,
  from: Position<S>,
  ctx: C,
  options?: { job?: string; checkpoints?: CheckpointPort<S> },
): Promise<RunOutcome<S>> {
  // Wiring faults, found before any handler runs: a guard the graph names
  // with no implementation, or a node a run could enter with no handler.
  for (const name of graph.guards) {
    if (!(name in guards)) throw new Error(`guard "${name}" has no implementation`);
  }
  for (const node of graph.nodes) {
    if (!graph.terminal.includes(node) && !(node in handlers)) {
      throw new Error(`node "${node}" has no handler`);
    }
  }

  let { node, step, state } = from;

  for (;;) {
    if (graph.terminal.includes(node)) return { ok: true, node, step, state };

    // Already checked above; the compiler cannot know, so the index is narrowed here.
    const handler = handlers[node];
    if (handler === undefined) throw new Error(`node "${node}" has no handler`);
    const wanted = await handler(state, ctx);
    if ("park" in wanted) return { ok: false, kind: "parked", node, step, state };
    const next = step + 1;

    // The same question the walker asks of a recorded pair, asked of a
    // move that has not happened yet. The guard reads the event just
    // recorded, because that event is what decided the branch.
    const edge = findOpenEdge(graph, guards, node, wanted.to, wanted.event);
    if (!edge.ok) {
      return edge.kind === "no_edge"
        ? { ok: false, kind: "no_edge", step: next, from: node, to: wanted.to }
        : { ok: false, kind: "guard_refused", step: next, from: node, to: wanted.to, guards: edge.guards };
    }

    step = next;
    node = wanted.to;
    state = wanted.state;
    options?.checkpoints?.save({ job: options.job ?? graph.name, step, node, state });
  }
}
