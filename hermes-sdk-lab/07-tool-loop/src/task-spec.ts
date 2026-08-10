/**
 * The TASK SPEC — Hermes's contract for the WORK.
 *
 * Carried forward from exercise 06. The schema, the two derived types and
 * the gate all behave exactly as they did. Two things changed: the comments,
 * because `allowedTools` finally has a reader, and the issue formatter,
 * which moved to issues.ts once a third boundary wanted the same three lines.
 *
 * Lesson 0005 parsed bytes arriving from a provider. This file parses bytes
 * arriving from an operator: a JSON file on disk, written by a human or by
 * another program, and therefore untrusted in the same way.
 *
 * Read the imports: this file imports zod and nothing else. It does not
 * import gateway.ts, and gateway.ts does not import it. That separation is
 * why exercise 07 could rewrite the port without touching this file.
 *
 * Verified against zod 4.4.3 (pinned exact — see README).
 */
import { z } from "zod";
import { formatIssues } from "./issues.js";

/**
 * The schema is the contract. Every field here is a field the Phase 1 loop
 * can already read; nothing is declared "for later", because a field nobody
 * consumes is a promise nobody keeps.
 *
 * Field-by-field, and why each one is shaped the way it is:
 *
 *   title / owner       — ADR-0015's "who did this" question is answered
 *                         from the spec, so both must be non-empty.
 *   instruction         — the transcript's first turn. The only field the
 *                         model ever sees verbatim.
 *   maxTokens           — becomes ModelCall.maxTokens, per iteration.
 *                         Bounded at 4096 so a typo cannot buy a huge
 *                         generation.
 *   costCeilingTokens   — the job's whole budget, across every iteration.
 *                         Lesson 0009 enforces it; today it is declared and
 *                         reported, and the refinement below relies on it.
 *   allowedTools        — the tool policy. Exercise 07 reads it twice: to
 *                         decide which tools are declared, and to check the
 *                         name that comes back. Empty by default, because a
 *                         spec that says nothing about tools permits none.
 *   outputPath          — where the artifact lands (S8).
 */
export const TaskSpecSchema = z
  .object({
    title: z.string().min(1),
    owner: z.string().min(1),
    instruction: z.string().min(1),

    // `.default(...)` makes the field OPTIONAL on the way in and GUARANTEED
    // on the way out — which is why this schema has two static types.
    maxTokens: z.number().int().positive().max(4096).default(1024),

    costCeilingTokens: z.number().int().positive(),

    // Default-empty, not default-permissive. The safe default for a
    // permission list is the one that grants nothing.
    allowedTools: z.array(z.string()).default([]),

    outputPath: z.string().min(1),
  })
  /**
   * A REFINEMENT: a rule that runs after every field's type has passed.
   * No single field is wrong here — the pair is. z.object() cannot express
   * that, because it checks fields one at a time.
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
 * `z.infer` is an alias for `z.output`, which is why lesson 0005 only ever
 * needed one name: that schema had no defaults, so its two types matched.
 */
export type TaskSpec = z.output<typeof TaskSpecSchema>;
export type TaskSpecInput = z.input<typeof TaskSpecSchema>;

/**
 * Admission's answer, as data. The same discriminated-union shape as
 * GatewayResult, Turn, and safeParse itself: proof on one arm, reasons on
 * the other, never both, nothing thrown.
 */
export type Admission =
  | { admitted: true; spec: TaskSpec }
  | { admitted: false; rejections: string[] };

/**
 * THE GATE. Every path into the loop goes through this function, and
 * nothing downstream accepts an unadmitted spec — the type system will not
 * let it, because runTask() asks for a TaskSpec and the only way to obtain
 * one is a successful parse.
 *
 * `raw` is `unknown` on purpose. JSON.parse hands back `any`, and `any`
 * would let a caller skip this function without the compiler objecting.
 */
export function admitTaskSpec(raw: unknown): Admission {
  const parsed = TaskSpecSchema.safeParse(raw);

  if (!parsed.success) {
    return { admitted: false, rejections: formatIssues(parsed.error) };
  }

  return { admitted: true, spec: parsed.data };
}
