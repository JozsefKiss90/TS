/**
 * The APPROVAL QUEUE (lesson 0019).
 *
 * Lesson 0010 promised a queue of pending approvals an operator can
 * browse. It is not a new record. A job whose run parked at
 * `awaiting_approval` left a checkpoint that names the node, carries the
 * pending call, and holds no verdict yet. The queue is the set of those
 * checkpoints, wherever the wiring keeps them.
 *
 * Answering one writes the operator's verdict into the checkpoint's
 * state. The resumed handler reads it, records the approval event, and
 * the call is answered the way an in-process verdict answers it. The
 * trace never learns that a second process was involved.
 *
 * Both functions are pure. Reading checkpoints from a directory, and
 * writing an answered one back, is the wiring's business (main.ts).
 */
import type { JobCheckpoint } from "./checkpoint.js";
import type { JobState } from "./job-state.js";

export const PARKING_NODE = "awaiting_approval";

/** The two words an operator may write. Derived from the state so the two cannot drift. */
export type Verdict = Exclude<NonNullable<JobState["verdict"]>, "no_channel">;

/** The checkpoints that wait for an operator, in the order given. */
export function parkedJobs(checkpoints: readonly JobCheckpoint[]): JobCheckpoint[] {
  return checkpoints.filter((c) => c.node === PARKING_NODE && c.state.verdict === null);
}

export type Answer = { ok: true; checkpoint: JobCheckpoint } | { ok: false; reason: string };

/**
 * The operator's verdict, written into a parked checkpoint. Refused when
 * the job is not waiting, was already answered, or has nothing pending:
 * each is a wiring fault, and none may reach the resumed handler.
 */
export function answerParked(checkpoint: JobCheckpoint, verdict: Verdict): Answer {
  if (checkpoint.node !== PARKING_NODE) {
    return { ok: false, reason: `the job stands at ${checkpoint.node}, not at ${PARKING_NODE}` };
  }
  if (checkpoint.state.verdict !== null) {
    return { ok: false, reason: `the job was already answered: ${checkpoint.state.verdict}` };
  }
  if (checkpoint.state.pending.length === 0) {
    return { ok: false, reason: "the job has no pending tool call to answer" };
  }
  return { ok: true, checkpoint: { ...checkpoint, state: { ...checkpoint.state, verdict } } };
}
