/**
 * The CHECKPOINT at the boundary (lesson 0018).
 *
 * A checkpoint is the job state plus the node the run is about to enter,
 * written after every step. One file per job, replaced on every step: a
 * checkpoint is where the run IS, and the trace is what the run DID. The
 * trace appends a line per event and never rewrites one. The checkpoint
 * keeps the latest state and nothing older.
 *
 * Reading one back is a JSON boundary, the fifth this course defends:
 * replies, specs, tool arguments, trace lines, and now this. The shape is
 * strict, so an `events` key is refused at the root. A checkpoint that
 * carried events would be a trace, and the two records never merge.
 */
import { z } from "zod";
import { formatIssues } from "../../07-tool-loop/src/issues.js";
import type { Checkpoint } from "./interpreter.js";
import { JobStateSchema, type JobState } from "./job-state.js";

const Name = z.string().regex(/^[a-z][a-z0-9_]*$/, "a name is a lowercase identifier");

export const CheckpointSchema = z.strictObject({
  /** The job this belongs to: the spec's title. */
  job: z.string().min(1),
  /** How many steps the run has taken. Zero is a run that has not moved. */
  step: z.number().int().nonnegative(),
  /** The node the run enters next. Its handler has not run yet. */
  node: Name,
  state: JobStateSchema,
});

export type JobCheckpoint = Checkpoint<JobState>;

export type CheckpointAdmission =
  | { admitted: true; checkpoint: JobCheckpoint }
  | { admitted: false; rejections: string[] };

/** The boundary. A checkpoint file is bytes, and bytes are parsed, never cast. */
export function admitCheckpoint(raw: unknown): CheckpointAdmission {
  const parsed = CheckpointSchema.safeParse(raw);
  if (!parsed.success) return { admitted: false, rejections: formatIssues(parsed.error) };
  return { admitted: true, checkpoint: parsed.data };
}
