/**
 * A frozen benchmark and its baseline (lesson 0027).
 *
 * A benchmark is a task file, every recording it names, and the trial
 * counts n and k. Its hash covers the task file and the recordings, so a
 * changed weight or a re-recorded fixture is a different benchmark, not a
 * better or worse score on the same one.
 *
 * The baseline is the scorecard the gate compares against. It keeps each
 * task's failed seeds and graders, so the gate can tell a new failure from
 * an old one even when the pass count is unchanged. It names the ADR that
 * promoted it. It has no clock, so the same loop writes the same bytes.
 */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { z } from "zod";
import { formatIssues } from "../../07-tool-loop/src/issues.js";
import { RunNameSchema } from "../../14-reliability/src/artifact.js";
import { GraderNameSchema } from "./golden-task.js";
import type { TrialScorecard } from "./trials.js";

/** Git on Windows may check text out with CRLF. The hash must not see that. */
const normalized = (path: string): string => readFileSync(path, "utf8").replaceAll("\r\n", "\n");

/** Every recording a task file names, in file order. Read from the raw JSON, so it needs no admission. */
function recordingsIn(raw: unknown): string[] {
  const tasks = (raw as { tasks?: { fixture?: unknown }[] }).tasks ?? [];
  return tasks.flatMap(({ fixture }) =>
    typeof fixture === "string" ? [fixture] : Array.isArray(fixture) ? fixture.map((v: { recording: string }) => v.recording) : [],
  );
}

/**
 * sha256 over the task file, then each recording, each as "path\ncontent\n".
 * The path is the one written in the task file, so moving the lab does not
 * change the hash, and swapping two recordings does.
 */
export function benchmarkHash(taskFile: string): string {
  const text = normalized(taskFile);
  const hash = createHash("sha256").update(`${text}\n`);
  for (const recording of recordingsIn(JSON.parse(text))) {
    hash.update(`${recording}\n${normalized(resolve(dirname(taskFile), recording))}\n`);
  }
  return `sha256:${hash.digest("hex")}`;
}

const HashSchema = z.string().regex(/^sha256:[0-9a-f]{64}$/);

/** How a baseline names its ADR: relative to the repository root, forward slashes. */
export const AdrRefSchema = z.string().regex(/^docs\/adr\/\d{4}-[a-z0-9-]+\.md$/);

export const BaselineSchema = z.strictObject({
  /** The benchmark's name, e.g. "benchmark-v1". */
  benchmark: z.string().min(1),
  hash: HashSchema,
  /** The loop whose scorecard this is. */
  loop: z.string().min(1),
  n: z.number().int().positive(),
  k: z.number().int().positive(),
  /** The ADR that promoted this baseline, relative to the repository root. */
  adr: AdrRefSchema,
  tasks: z.array(
    z.strictObject({
      id: RunNameSchema,
      passed: z.number().int().nonnegative(),
      passHatK: z.number().min(0).max(1),
      /** Every trial that failed, with the graders that failed it. */
      failures: z.array(z.strictObject({ seed: z.number().int().positive(), graders: z.array(GraderNameSchema).min(1) })),
    }),
  ),
});

export type Baseline = z.infer<typeof BaselineSchema>;

export function admitBaseline(raw: unknown): { ok: true; baseline: Baseline } | { ok: false; reason: string } {
  const parsed = BaselineSchema.safeParse(raw);
  return parsed.success ? { ok: true, baseline: parsed.data } : { ok: false, reason: formatIssues(parsed.error).join("; ") };
}

export function loadBaseline(path: string): { ok: true; baseline: Baseline } | { ok: false; reason: string } {
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    return { ok: false, reason: error instanceof Error ? error.message : String(error) };
  }
  return admitBaseline(raw);
}

/** The baseline a trial scorecard becomes: counts and failures kept, runs dropped. */
export function baselineFrom(card: TrialScorecard, benchmark: string, hash: string, adr: string): Baseline {
  return BaselineSchema.parse({
    benchmark,
    hash,
    loop: card.loop,
    n: card.n,
    k: card.k,
    adr,
    tasks: card.tasks.map((t) => ({
      id: t.id,
      passed: t.passed,
      passHatK: t.passHatK,
      failures: t.runs.filter((r) => !r.pass).map((r) => ({ seed: r.seed, graders: r.failed })),
    })),
  });
}
