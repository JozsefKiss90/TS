/**
 * The audit job on a framework THREAD (lesson 0020).
 *
 * Lab 12's `startJob` and `resumeJob` go through the port, so the
 * framework's record of the run lasts one call and lab 12's checkpoint is
 * what a later process resumes from. This file uses the framework's own
 * protocol instead. A held call pauses with `interrupt()`, the checkpointer
 * keeps the thread, and the operator's verdict comes back as
 * `new Command({ resume: verdict })` on the same thread id.
 *
 * Only the wiring is new. The handlers, guards, context and report are
 * lab 12's, imported. The one piece of Hermes logic here is `verdict`:
 * the parse that admits the operator's answer, and the line that writes
 * it into the state, which is what lab 12's `answerParked` does to a file.
 */
import type { BaseCheckpointSaver } from "@langchain/langgraph";
import { z } from "zod";
import type { ModelGateway } from "../../07-tool-loop/src/gateway.js";
import type { TaskSpec } from "../../07-tool-loop/src/task-spec.js";
import type { TracePort } from "../../07-tool-loop/src/trace.js";
import { jobLifecycleGuards } from "../../12-workflow-graph/src/guards.js";
import { finishJob, jobContext, jobLifecycleHandlers, type JobResult } from "../../12-workflow-graph/src/handlers.js";
import type { CheckpointPort, RunOutcome } from "../../12-workflow-graph/src/interpreter.js";
import { initialState, type JobState } from "../../12-workflow-graph/src/job-state.js";
import type { WorkflowGraph } from "../../12-workflow-graph/src/workflow-graph.js";
import { orchestrate, type Answer, type Orchestration } from "./langgraph-runner.js";

/** The two words an operator may send. The framework parses the resume value with it. */
const VerdictSchema = z.enum(["approved", "denied"]);

const verdict: Answer<JobState> = {
  schema: VerdictSchema,
  apply: (state, answer) => ({ ...state, verdict: VerdictSchema.parse(answer) }),
};

export interface ThreadOptions {
  saver: BaseCheckpointSaver;
  thread: string;
  trace?: TracePort;
  checkpoints?: CheckpointPort<JobState>;
}

/** What one process holds for a job: the run, the report it ends with, and the timer to stop. */
interface ThreadWiring {
  run: Orchestration<JobState>;
  finish: (outcome: RunOutcome<JobState>) => JobResult;
  disarm: () => void;
}

/** One process's view of the job: a fresh context, a fresh set of bounds, the shared saver. */
function wire(
  graph: WorkflowGraph,
  spec: TaskSpec,
  gateway: ModelGateway,
  options: ThreadOptions,
): ThreadWiring {
  const ctx = jobContext(spec, gateway, {
    park: true,
    ...(options.trace ? { trace: options.trace } : {}),
  });
  const run = orchestrate(graph, jobLifecycleGuards, jobLifecycleHandlers, ctx, {
    job: spec.title,
    saver: options.saver,
    answer: verdict,
    ...(options.checkpoints ? { checkpoints: options.checkpoints } : {}),
  });
  return { run, finish: (outcome) => finishJob(ctx, outcome), disarm: () => ctx.bounds.disarm() };
}

/** A fresh run on a thread. A held call pauses it. */
export async function startOnThread(
  graph: WorkflowGraph,
  spec: TaskSpec,
  gateway: ModelGateway,
  options: ThreadOptions,
): Promise<JobResult> {
  const { run, finish, disarm } = wire(graph, spec, gateway, options);
  try {
    return finish(await run.start({ node: graph.start, step: 0, state: initialState(spec) }, options.thread));
  } finally {
    disarm();
  }
}

/** The operator's verdict, sent to the paused thread. The framework re-runs the paused node. */
export async function answerOnThread(
  graph: WorkflowGraph,
  spec: TaskSpec,
  gateway: ModelGateway,
  answer: unknown,
  options: ThreadOptions,
): Promise<JobResult> {
  const { run, finish, disarm } = wire(graph, spec, gateway, options);
  try {
    return finish(await run.resume(answer, options.thread));
  } finally {
    disarm();
  }
}

/** The framework nodes a thread will run next: its own answer to "is this job waiting?". */
export function waitingAt(graph: WorkflowGraph, saver: BaseCheckpointSaver, thread: string): Promise<string[]> {
  // next() reads the saver only. No handler runs, so no context is needed.
  return orchestrate(graph, jobLifecycleGuards, jobLifecycleHandlers, undefined as never, { saver }).next(thread);
}

/** How many checkpoints the framework wrote for a thread. Lab 12 writes one per move. */
export async function frameworkCheckpoints(saver: BaseCheckpointSaver, thread: string): Promise<number> {
  let count = 0;
  for await (const _ of saver.list({ configurable: { thread_id: thread } })) count += 1;
  return count;
}
