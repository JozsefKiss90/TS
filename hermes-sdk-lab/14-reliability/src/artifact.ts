/**
 * The artifact (lesson 0024): what one run leaves behind, computed from
 * its trace.
 *
 * Pure, like costReport. No clock and no file system: landing the same
 * trace twice gives the same artifact, byte for byte, because every field
 * is read from a trace line or computed from trace lines.
 *
 * The trace stays the one record of what happened. The artifact holds the
 * run's output and two links: one to the trace it came from, one to the
 * cost report beside it. The output text is copied, because a reader of
 * the artifact wants the product, not the history. A test proves the copy
 * agrees with the trace line it came from.
 */
import { z } from "zod";
import { formatIssues } from "../../07-tool-loop/src/issues.js";
import type { TraceEvent } from "../../07-tool-loop/src/trace.js";
import { costReport, type CostReport } from "./cost-report.js";
import type { ModelPrice } from "./prices.js";

/** The file a reader opens first. Written last, so its presence means the folder is whole. */
export const ARTIFACT_FILE = "artifact.json";
/** The cost report, written first, beside the artifact. */
export const COST_FILE = "cost-report.json";

/**
 * A run's folder name. The trace holds no job id, so the run is named
 * after its trace file. One plain path segment: no dots first, no slashes,
 * so a name can never point outside the artifacts folder.
 */
export const RunNameSchema = z.string().regex(/^[a-z0-9][a-z0-9-]*$/, "one lowercase path segment");

const Count = z.number().int().nonnegative();

/**
 * Strict, because lab 16's graders will read these bytes and nothing
 * else. Every field a grader may rely on is named here. `status` uses the
 * two terminal words Hermes OS accepts, done and failed.
 */
export const ArtifactSchema = z.strictObject({
  run: RunNameSchema,
  title: z.string().min(1),
  owner: z.string().min(1),
  status: z.enum(["done", "failed"]),
  /** job_ended's outcome. Null when the record has no job_ended. */
  outcome: z.string().min(1).nullable(),
  /** Why the run failed. Null when it is done. */
  reason: z.string().min(1).nullable(),
  /** The last completed reply, or the partial text a stopped call kept. Null when there is neither. */
  output: z.strictObject({ text: z.string(), partial: z.boolean() }).nullable(),
  /** The trace file, as a path relative to this artifact's folder. */
  trace: z.string().min(1),
  costReport: z.literal(COST_FILE),
  totals: z.strictObject({ calls: Count, tokens: Count, microUsd: Count }),
  /** The cost report's check against job_ended. */
  agrees: z.boolean(),
  /** job_ended's time. Null when the record has no job_ended. */
  endedAt: Count.nullable(),
});

export type Artifact = z.infer<typeof ArtifactSchema>;

export type BuiltArtifact =
  | { ok: true; artifact: Artifact; report: CostReport }
  | { ok: false; reason: string };

type Of<K extends TraceEvent["kind"]> = Extract<TraceEvent, { kind: K }>;

/** The output and the status, decided by how the record ends. */
function ending(events: TraceEvent[]): Pick<Artifact, "status" | "outcome" | "reason" | "output" | "endedAt"> {
  const ended = events.find((e): e is Of<"job_ended"> => e.kind === "job_ended");
  if (ended === undefined) {
    // The process stopped before it wrote job_ended: a crash or a kill.
    // Any text still streaming lived in memory only, so there is none here.
    return {
      status: "failed",
      outcome: null,
      reason: "the record has no job_ended: the run stopped before it ended",
      output: null,
      endedAt: null,
    };
  }
  const partial = ended.partialText === undefined ? null : { text: ended.partialText, partial: true };
  if (ended.outcome !== "landed") {
    return { status: "failed", outcome: ended.outcome, reason: `the job ended ${ended.outcome}`, output: partial, endedAt: ended.at };
  }
  const last = events.findLast((e): e is Of<"reply"> => e.kind === "reply" && e.stop === "completed");
  if (last === undefined) {
    return { status: "failed", outcome: ended.outcome, reason: "landed with no completed reply", output: null, endedAt: ended.at };
  }
  return { status: "done", outcome: ended.outcome, reason: null, output: { text: last.text, partial: false }, endedAt: ended.at };
}

/**
 * One run's artifact and the cost report it links to.
 *
 * `trace` is the link exactly as it will be stored: the caller works out
 * the path relative to the artifact's folder, because only the caller
 * knows where both live.
 */
export function buildArtifact(run: string, events: TraceEvent[], price: ModelPrice, trace: string): BuiltArtifact {
  const name = RunNameSchema.safeParse(run);
  if (!name.success) return { ok: false, reason: `run name "${run}" is not one lowercase path segment` };

  const costed = costReport(events, price);
  if (!costed.ok) return { ok: false, reason: costed.reason };
  const { report } = costed;

  const started = events.find((e): e is Of<"job_started"> => e.kind === "job_started");
  if (started === undefined) return { ok: false, reason: "no job_started: the record cannot say what ran" };

  const artifact: Artifact = {
    run: name.data,
    title: started.title,
    owner: started.owner,
    ...ending(events),
    trace,
    costReport: COST_FILE,
    totals: report.totals,
    agrees: report.agrees,
  };
  // The parse puts the fields in the schema's order, which is the order
  // on disk, and proves the object is one a reader will admit.
  return { ok: true, artifact: ArtifactSchema.parse(artifact), report };
}

export type ArtifactAdmission = { ok: true; artifact: Artifact } | { ok: false; reason: string };

/** Bytes on disk are parsed, never cast. */
export function admitArtifact(raw: unknown): ArtifactAdmission {
  const parsed = ArtifactSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, reason: formatIssues(parsed.error).join("; ") };
  return { ok: true, artifact: parsed.data };
}
