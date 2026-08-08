/**
 * The TASK SPEC — Hermes's contract for the WORK.
 *
 * Lesson 0005 parsed bytes arriving from a provider. This file parses
 * bytes arriving from an operator: a JSON file on disk, written by a
 * human or by another program, and therefore untrusted in the same way.
 * Same move, opposite direction, and the second JSON boundary the
 * control plane owns.
 *
 * Read the imports: this file imports zod and nothing else. It does not
 * import gateway.ts, and gateway.ts does not import it. The spec says
 * what work is admissible; the port says how a model call is made.
 * Keeping them apart is what lets lesson 0008 grow the spec without
 * touching the adapter.
 *
 * Verified against zod 4.4.3 (pinned exact — see README).
 */
import { z } from "zod";

/**
 * The schema is the contract. Every field here is a field the Phase 1
 * loop can already read; nothing is declared "for later", because a
 * field nobody consumes is a promise nobody keeps.
 *
 * Field-by-field, and why each one is shaped the way it is:
 *
 *   title / owner       — ADR-0015's "who did this" question is answered
 *                         from the spec, so both must be non-empty.
 *   instruction         — becomes ModelCall.prompt. The only field the
 *                         model ever sees.
 *   maxTokens           — becomes ModelCall.maxTokens. Bounded at 4096
 *                         so a typo cannot buy a huge generation.
 *   costCeilingTokens   — the job's whole budget. Lesson 0009 enforces
 *                         it; today it only has to be declared, and the
 *                         refinement below already relies on it.
 *   allowedTools        — the tool policy. Empty by default: a spec that
 *                         says nothing about tools permits nothing.
 *   outputPath          — where the artifact lands (S8).
 */
export const TaskSpecSchema = z
  .object({
    title: z.string().min(1),
    owner: z.string().min(1),
    instruction: z.string().min(1),

    // `.default(...)` is the new move. It makes the field OPTIONAL on the
    // way in and GUARANTEED on the way out — which is why this schema has
    // two static types (see below), not one.
    maxTokens: z.number().int().positive().max(4096).default(1024),

    costCeilingTokens: z.number().int().positive(),

    // Default-empty, not default-permissive. The safe default for a
    // permission list is the one that grants nothing.
    allowedTools: z.array(z.string()).default([]),

    outputPath: z.string().min(1),
  })
  /**
   * A REFINEMENT: a rule that runs after every field's type has passed.
   * No single field is wrong here — the pair is. z.object() cannot
   * express that, because it checks fields one at a time.
   *
   * `path` decides where the issue is reported. Without it the issue
   * lands at the root, which is true but useless to an operator staring
   * at a file. With it, the rejection names the field to edit.
   */
  .refine((spec) => spec.maxTokens <= spec.costCeilingTokens, {
    error: "maxTokens may not exceed the job's costCeilingTokens",
    path: ["maxTokens"],
  });

/**
 * TWO types from one schema, because `.default()` made them differ.
 *
 *   TaskSpecInput  — what a spec FILE may contain. maxTokens optional.
 *   TaskSpec       — what an admitted spec IS.     maxTokens present.
 *
 * `z.infer` is an alias for `z.output`, which is why lesson 0005 only
 * ever needed one name: that schema had no defaults and no transforms,
 * so its two types were identical.
 *
 * Only TaskSpec crosses into the supervisor. The loop never handles a
 * value whose maxTokens might be missing.
 */
export type TaskSpec = z.output<typeof TaskSpecSchema>;
export type TaskSpecInput = z.input<typeof TaskSpecSchema>;

/**
 * Admission's answer, as data. The same discriminated-union shape as
 * GatewayResult (exercise 05) and safeParse (exercise 04): proof on one
 * arm, reasons on the other, never both, nothing thrown.
 */
export type Admission =
  | { admitted: true; spec: TaskSpec }
  | { admitted: false; rejections: string[] };

/**
 * THE GATE. Every path into the loop goes through this function, and
 * nothing downstream accepts an unadmitted spec — the type system will
 * not let it, because runTask() asks for a TaskSpec and the only way to
 * obtain one is a successful parse.
 *
 * `raw` is `unknown` on purpose. JSON.parse hands back `any`, and `any`
 * would let a caller skip this function without the compiler objecting.
 */
export function admitTaskSpec(raw: unknown): Admission {
  // ── TODO (Part B) ──────────────────────────────────────────────────
  // safeParse `raw`, and turn a failure into `rejections` — one readable
  // line per issue, formatted exactly as the adapter formats its
  // malformed_reply issues (open anthropic-gateway.ts and copy the
  // shape; a control plane whose two boundaries report differently is a
  // control plane whose logs need two parsers).
  //
  //   path.join(".") — the field, or "(root)" when the path is empty
  //   issue.code     — the machine-readable reason
  //   issue.message  — the human-readable one
  //
  // Do not throw. A bad spec is an expected outcome, not a crash.
  // ───────────────────────────────────────────────────────────────────
  const parsed = TaskSpecSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      admitted: false,
      rejections: parsed.error.issues.map(
        (issue) => `${issue.path.join(".") || "(root)"}: [${issue.code}] ${issue.message}`,
      ),
    };
  }

  return { admitted: true, spec: parsed.data };
}
