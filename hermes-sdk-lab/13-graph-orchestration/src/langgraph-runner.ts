/**
 * The LANGGRAPH RUNNER — lab 12's graph, run by LangGraph.js (lesson 0020).
 *
 * Lab 12's `runGraph` is a loop of about forty lines: run the handler,
 * ask the graph for an edge, write a checkpoint, move. This file keeps
 * that function's signature and hands the loop to a `StateGraph`:
 *
 *   traversal      — each lab 12 node becomes a framework node, and the
 *                    framework decides which one runs next.
 *   edges          — each node gets one conditional edge. Its router asks
 *                    lab 12's `findOpenEdge`, so the guards stay Hermes's.
 *   pause          — a handler's park becomes `interrupt()`, which needs a
 *                    checkpointer. The framework keeps the paused thread.
 *
 * What stays outside the framework: the graph file and its parse, the
 * guards, the handlers, the trace, lab 12's checkpoint port, and the
 * refusal types. Lab 12's tests run against this file unchanged
 * (vitest.config.ts swaps it in), and that is the measurement.
 *
 * Verified against @langchain/langgraph 1.4.21 and @langchain/core 1.2.17,
 * pinned exact in package.json.
 */
import { randomUUID } from "node:crypto";
import {
  Annotation,
  Command,
  END,
  MemorySaver,
  START,
  StateGraph,
  interrupt,
  isInterrupted,
  type BaseCheckpointSaver,
} from "@langchain/langgraph";
import type { z } from "zod";
import type * as Lab12 from "../../12-workflow-graph/src/interpreter.js";
import type {
  CheckpointPort,
  HandlerTable,
  Move,
  Position,
  RunOutcome,
} from "../../12-workflow-graph/src/interpreter.js";
import { findOpenEdge, type GuardTable } from "../../12-workflow-graph/src/walker.js";
import type { WorkflowGraph } from "../../12-workflow-graph/src/workflow-graph.js";

// The port's types are lab 12's, re-exported, so a file that imports this
// module in place of lab 12's interpreter finds every name it expects.
export type {
  Checkpoint,
  CheckpointPort,
  HandlerTable,
  Move,
  NodeHandler,
  Park,
  Parked,
  Position,
  Refusal,
  RunOutcome,
  Step,
} from "../../12-workflow-graph/src/interpreter.js";

/** Which engine runs the graph. tests/port.test.ts reads it to prove the swap. */
export const ENGINE = "langgraph";

let runs = 0;
/** How many runs this module started. tests/port.test.ts reads it. */
export const frameworkRuns = (): number => runs;

/**
 * Lab 12 has no step limit. LangGraph's default is 25 steps, after which a
 * run throws GraphRecursionError. The runner raises it so lab 12's runs
 * keep their meaning. A run this long would be a wiring fault.
 */
const STEP_LIMIT = 10_000;

/** How a value given to Command({ resume }) enters the state. Framework-native resume only. */
export interface Answer<S> {
  schema: z.ZodType;
  apply: (state: S, answer: unknown) => S;
}

export interface OrchestrateOptions<S> {
  job?: string;
  checkpoints?: CheckpointPort<S>;
  /** The framework's own record of a thread. Defaults to a fresh MemorySaver. */
  saver?: BaseCheckpointSaver;
  answer?: Answer<S>;
  recursionLimit?: number;
}

export interface Orchestration<S> {
  /** Run from a position, on a thread of the framework's checkpointer. */
  start(from: Position<S>, thread: string): Promise<RunOutcome<S>>;
  /** Continue a thread paused by interrupt(). The value becomes interrupt()'s return. */
  resume(answer: unknown, thread: string): Promise<RunOutcome<S>>;
  /** The framework nodes a thread will run next. Empty when it has ended. */
  next(thread: string): Promise<string[]>;
}

/**
 * Builds the StateGraph for one lab 12 graph. The framework's state has two
 * channels: where the run stands, and the move the last handler asked for.
 * A move is not made by the handler's node. The router checks it, and the
 * node it routes to makes it on arrival: that node advances the step and
 * calls lab 12's checkpoint port, as lab 12's loop does after each move.
 */
export function orchestrate<S, C>(
  graph: WorkflowGraph,
  guards: GuardTable,
  handlers: HandlerTable<S, C>,
  ctx: C,
  options: OrchestrateOptions<S> = {},
): Orchestration<S> {
  // Wiring faults, found before any handler runs. Same checks as lab 12.
  for (const name of graph.guards) {
    if (!(name in guards)) throw new Error(`guard "${name}" has no implementation`);
  }
  for (const node of graph.nodes) {
    if (!graph.terminal.includes(node) && !(node in handlers)) {
      throw new Error(`node "${node}" has no handler`);
    }
  }

  const Channels = Annotation.Root({
    at: Annotation<Position<S>>(),
    wanted: Annotation<Move<S> | null>(),
  });
  type Channels = typeof Channels.State;

  const job = options.job ?? graph.name;

  /** The move the router let through, made now. A resumed run has none to make. */
  function arrive(node: string, s: Channels): Position<S> {
    if (s.wanted === null) return s.at;
    const at = { node, step: s.at.step + 1, state: s.wanted.state };
    options.checkpoints?.save({ job, ...at });
    return at;
  }

  // The node names are only known at run time, so the builder is typed
  // with plain strings. The framework's literal-name typing cannot apply.
  const builder = new StateGraph(Channels) as unknown as StateGraph<typeof Channels.spec, Channels, Partial<Channels>, string>;

  for (const node of graph.nodes) {
    if (graph.terminal.includes(node)) {
      builder.addNode(node, (s: Channels) => ({ at: arrive(node, s), wanted: null }));
      builder.addEdge(node, END);
      continue;
    }

    builder.addNode(node, async (s: Channels) => {
      const at = arrive(node, s);
      const handler = handlers[node];
      if (handler === undefined) throw new Error(`node "${node}" has no handler`);
      let step = await handler(at.state, ctx);
      if ("park" in step) {
        // The run stops here. Under the port, nothing ever resumes this
        // thread: lab 12 resumes from its own checkpoint, on a new one.
        // Under Command({ resume }), the framework restarts this node, the
        // handler parks again, interrupt() returns the answer, and the
        // handler runs a third time with the answer in its state.
        const answer: unknown = interrupt(at, options.answer ? { responseSchema: options.answer.schema } : {});
        if (options.answer === undefined) throw new Error(`node "${node}" resumed with no way to read the answer`);
        step = await handler(options.answer.apply(at.state, answer), ctx);
        if ("park" in step) throw new Error(`node "${node}" parked again after an answer`);
      }
      return { at, wanted: step };
    });

    // The edges the graph file draws out of this node, plus END for a refusal.
    const targets = [...new Set(graph.edges.filter((e) => e.from === node).map((e) => e.to))];
    builder.addConditionalEdges(
      node,
      (s: Channels) => {
        const wanted = s.wanted;
        if (wanted === null) return END;
        const edge = findOpenEdge(graph, guards, s.at.node, wanted.to, wanted.event);
        return edge.ok ? wanted.to : END;
      },
      [...targets, END],
    );
  }

  // A run may start at any node: a fresh one, or a resumed one.
  builder.addConditionalEdges(START, (s: Channels) => s.at.node, [...graph.nodes]);

  const saver = options.saver ?? new MemorySaver();
  const compiled = builder.compile({ checkpointer: saver });
  const config = (thread: string) => ({
    configurable: { thread_id: thread },
    recursionLimit: options.recursionLimit ?? STEP_LIMIT,
  });

  /** The framework's final channels, read back as lab 12's result types. */
  function outcome(result: Channels): RunOutcome<S> {
    if (isInterrupted<Position<S>>(result)) {
      const at = result.__interrupt__[0]?.value;
      if (at === undefined) throw new Error("interrupted with no position");
      return { ok: false, kind: "parked", ...at };
    }
    const { at, wanted } = result;
    if (wanted === null) return { ok: true, node: at.node, step: at.step, state: at.state };

    // The router sent the run to END instead of moving it. The router
    // cannot write state, so the refusal is named by asking again. Safe
    // because every guard is a pure function of the event being left.
    const edge = findOpenEdge(graph, guards, at.node, wanted.to, wanted.event);
    const step = at.step + 1;
    if (edge.ok) throw new Error(`the run stopped at ${at.node} with an open edge to ${wanted.to}`);
    return edge.kind === "no_edge"
      ? { ok: false, kind: "no_edge", step, from: at.node, to: wanted.to }
      : { ok: false, kind: "guard_refused", step, from: at.node, to: wanted.to, guards: edge.guards };
  }

  return {
    async start(from, thread) {
      runs += 1;
      return outcome(await compiled.invoke({ at: from, wanted: null }, config(thread)));
    },
    async resume(answer, thread) {
      // Sent to a thread with nothing paused, Command would start an empty
      // run that fails deep inside the framework. Refuse it here instead.
      const paused = await compiled.getState(config(thread));
      if (paused.next.length === 0) throw new Error(`thread "${thread}" holds no paused run`);
      return outcome(await compiled.invoke(new Command({ resume: answer }), config(thread)));
    },
    async next(thread) {
      return [...(await compiled.getState(config(thread))).next];
    },
  };
}

/**
 * Lab 12's port, on the framework. Same signature, checked by the
 * compiler against lab 12's declaration. One fresh thread per call: the
 * framework's record lives as long as the call, and lab 12's checkpoint
 * port is the record a later process resumes from.
 */
export const runGraph: typeof Lab12.runGraph = async (graph, guards, handlers, from, ctx, options) =>
  orchestrate(graph, guards, handlers, ctx, {
    ...(options?.job !== undefined ? { job: options.job } : {}),
    ...(options?.checkpoints !== undefined ? { checkpoints: options.checkpoints } : {}),
  }).start(from, randomUUID());
