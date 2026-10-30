/**
 * The golden-task file (lesson 0025): what the loop should do, written
 * down before anything runs.
 *
 * A golden task is a spec, a recorded fixture, an expected ending and a
 * list of grader names. The names are data, like lab 12's guard names:
 * the file says WHICH checks a task needs, and graders.ts says WHAT each
 * check reads. A name with no function behind it is refused here, before
 * a single task runs.
 *
 * The spec field nests lab 07's TaskSpecSchema, so every rule a spec file
 * must pass also runs inside a task file. The spec is not re-declared.
 */
import { readFileSync } from "node:fs";
import { z } from "zod";
import { formatIssues } from "../../07-tool-loop/src/issues.js";
import type { AdmittedPack } from "../../07-tool-loop/src/supervisor.js";
import { TaskSpecSchema } from "../../07-tool-loop/src/task-spec.js";
import { RunNameSchema } from "../../14-reliability/src/artifact.js";

/** The graders graders.ts implements. Adding one means adding both. */
export const GRADER_NAMES = [
  "ends_as_expected",
  "reports_tool_output",
  "asks_before_held_tool",
  "uses_the_pack",
  "within_ceiling",
] as const;
export const GraderNameSchema = z.enum(GRADER_NAMES);
export type GraderName = z.infer<typeof GraderNameSchema>;

/**
 * The pack as the loop receives it: lab 07's AdmittedPack. A task carries
 * the dispatched form, because the fake run needs no evidence port. Lab 07
 * declares it as an interface, not a schema, so the shape is written here
 * and the annotation makes the compiler hold the two together.
 */
const PackSchema: z.ZodType<AdmittedPack> = z.strictObject({
  text: z.string().min(1),
  queries: z.array(z.string().min(1)).min(1),
  snapshot: z.string().min(1),
  assembledAt: z.iso.datetime(),
  ids: z.array(z.string().min(1)).min(1),
});

/** One recording a seeded trial may replay. The weight is its share of the trials. */
const VariantSchema = z.strictObject({
  recording: z.string().min(1),
  weight: z.number().int().min(1),
});

const GoldenTaskSchema = z
  .strictObject({
    /** Names the run's trace file and artifact folder, so it is one path segment. */
    id: RunNameSchema,
    spec: TaskSpecSchema,
    /**
     * A recorded trace, relative to the task file. Its reply lines are the
     * fake model's script. Lesson 0026: or a list of weighted recordings,
     * of which a seed picks one per trial.
     */
    fixture: z.union([z.string().min(1), z.array(VariantSchema).min(2)]),
    /** How the operator answers a held tool. Required exactly when the spec holds one. */
    operator: z.enum(["approves", "denies"]).optional(),
    pack: PackSchema.optional(),
    /** The ending a correct loop reaches. A golden task may expect a failure. */
    expect: z.strictObject({
      status: z.enum(["done", "failed"]),
      outcome: z.string().min(1).nullable(),
    }),
    graders: z.array(GraderNameSchema).min(1),
  })
  // Each rule below relates two fields, so no single field can state it.
  .refine((t) => (t.operator !== undefined) === (t.spec.approvalRequired.length > 0), {
    error: "operator is required exactly when the spec holds a tool",
    path: ["operator"],
  })
  .refine((t) => !t.graders.includes("asks_before_held_tool") || t.spec.approvalRequired.length > 0, {
    error: "asks_before_held_tool on a task whose spec holds no tool can never fail",
    path: ["graders"],
  })
  .refine((t) => !t.graders.includes("uses_the_pack") || t.pack !== undefined, {
    error: "uses_the_pack needs a pack",
    path: ["pack"],
  })
  .refine(
    (t) =>
      t.pack === undefined ||
      (t.pack.queries.length === t.spec.evidenceQueries.length &&
        t.pack.queries.every((q, i) => q === t.spec.evidenceQueries[i])),
    { error: "the pack must answer the spec's evidenceQueries, in order", path: ["pack", "queries"] },
  )
  .refine((t) => new Set(t.graders).size === t.graders.length, {
    error: "a grader is named twice",
    path: ["graders"],
  });

export const GoldenFileSchema = z
  .strictObject({ tasks: z.array(GoldenTaskSchema).min(1) })
  .refine((f) => new Set(f.tasks.map((t) => t.id)).size === f.tasks.length, {
    error: "two tasks share an id",
    path: ["tasks"],
  });

export type GoldenTask = z.infer<typeof GoldenTaskSchema>;

/** Every recording a task may replay, as a list. One path is a list of one, at weight 1. */
export type WeightedRecording = z.infer<typeof VariantSchema>;

export const variantsOf = (task: GoldenTask): WeightedRecording[] =>
  typeof task.fixture === "string" ? [{ recording: task.fixture, weight: 1 }] : task.fixture;

export type GoldenAdmission = { ok: true; tasks: GoldenTask[] } | { ok: false; reason: string };

/** THE GATE. `raw` is `unknown`, so no caller can skip the parse. */
export function admitGoldenTasks(raw: unknown): GoldenAdmission {
  const parsed = GoldenFileSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, reason: formatIssues(parsed.error).join("; ") };
  return { ok: true, tasks: parsed.data.tasks };
}

/** Reads and admits one task file. Fixture paths stay relative to it. */
export function loadGoldenTasks(path: string): GoldenAdmission {
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    return { ok: false, reason: `${path}: ${error instanceof Error ? error.message : String(error)}` };
  }
  return admitGoldenTasks(raw);
}
