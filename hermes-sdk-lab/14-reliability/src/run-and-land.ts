/**
 * One run of lab 12's loop, landed however it ends (lesson 0024).
 *
 * The wrapper writes every trace event to a file as it happens, the way
 * lab 07's file sink does, then lands that file when the run returns or
 * throws. A run that throws lands before the error reaches the caller.
 *
 * Two cases it cannot cover, and what covers them:
 *
 *   - A parked run has not ended. It returns a typed park and lands
 *     nothing. When it resumes and ends, this wrapper lands it then.
 *   - A killed process runs no more code. Its trace file is still on
 *     disk, so `landTrace` on that file lands it later, marked failed.
 */
import { appendFileSync } from "node:fs";
import type { TracePort } from "../../07-tool-loop/src/trace.js";
import type { JobResult } from "../../12-workflow-graph/src/handlers.js";
import { RunNameSchema } from "./artifact.js";
import { landTrace, runName, type Landing } from "./landing.js";
import type { ModelPrice } from "./prices.js";

export interface RunAndLand {
  result: JobResult;
  /** Null when the run parked: nothing has ended, so nothing lands. */
  landing: Landing | null;
}

export async function runAndLand(
  tracePath: string,
  root: string,
  price: ModelPrice,
  run: (trace: TracePort) => Promise<JobResult>,
): Promise<RunAndLand> {
  // Checked before the run, not after: a name the artifact would refuse
  // must not cost a whole run that then lands nothing.
  const name = runName(tracePath);
  if (!RunNameSchema.safeParse(name).success) throw new Error(`run name "${name}" is not one lowercase path segment`);
  // Synchronous, like lab 07's sink: the loop must not wait on its own record.
  const trace: TracePort = { append: (event) => appendFileSync(tracePath, `${JSON.stringify(event)}\n`) };
  let result: JobResult;
  try {
    result = await run(trace);
  } catch (error) {
    // The run threw. Land what the trace holds, then let the run's error
    // through. A landing that fails here must not replace that error: the
    // trace is still on disk, and `pnpm job --land <trace>` can retry.
    try {
      landTrace(tracePath, root, price);
    } catch {
      // The run's error is the one the caller needs.
    }
    throw error;
  }
  const parked = !result.ok && result.kind === "parked";
  return { result, landing: parked ? null : landTrace(tracePath, root, price) };
}
