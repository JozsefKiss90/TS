/**
 * The CONTEXT PACK — the evidence one job may be dispatched with, and the
 * gate that decides whether it may be dispatched at all (lesson 0016).
 *
 * Scenario step S2. Lesson 0014 designed one query's answer: a bundle of
 * items, each carrying its provenance. A job usually asks more than one
 * question, and the loop needs one thing to plan from. So a pack is the
 * merge of several bundles, plus the record of how it was assembled, plus
 * four rules that decide admissibility.
 *
 * Three pieces live here, in the order they run:
 *
 *   EvidencePort      — the port. The loop's word for "somewhere that
 *                         answers evidence queries". One method, because
 *                         the loop only ever asks questions.
 *   ContextPackSchema   — the contract. Four rules, two of them
 *                         cross-field, plus every rule the evidence schema
 *                         already carries, because the pack nests it.
 *   assembleContextPack — the assembler. Queries the port, merges the
 *                         bundles into an untyped candidate, and hands it
 *                         to the parse. The parse is the gate; this
 *                         function only gathers.
 *
 * `admitContextPack` returns the same discriminated union as
 * `admitTaskSpec` (lesson 0007): proof on one arm, reasons on the other,
 * nothing thrown. S1 admits the job, S2 admits its evidence, and both
 * answers have the same shape on purpose.
 *
 * Verified against zod 4.4.3 (pinned exact — see README).
 */
import { z } from "zod";
import { formatIssues } from "../../07-tool-loop/src/issues.js";
import type { AdmittedPack } from "../../07-tool-loop/src/supervisor.js";
import type { TaskSpec } from "../../07-tool-loop/src/task-spec.js";
import {
  EvidenceItemSchema,
  type EvidenceBundle,
  type EvidenceItem,
} from "../../10-graph-evidence/src/evidence.js";

// ── The port ────────────────────────────────────────────────────────────

/**
 * Where evidence comes from, in the loop's own words.
 *
 * Narrower than lesson 0014's `KnowledgeGraph`, which also serves one node
 * by id and lists everything it holds. A job that is being planned asks
 * questions and reads answers, so one method is the whole port. The MCP
 * client is one implementation; a fake list is another.
 */
export interface EvidencePort {
  /** One query's answer, with provenance on every item. A miss is empty. */
  search(query: string, limit: number): Promise<EvidenceBundle>;
}

// ── The contract ────────────────────────────────────────────────────────

/**
 * One query's contribution to the pack. PROV-DM's idea from lesson 0014,
 * applied one level up: the pack's own provenance says who answered which
 * question, from which snapshot, and how many items came back.
 *
 * `matched` is kept even when it is zero. A question that the graph could
 * not answer is a fact about the job, and deleting the row would hide it.
 */
export const PackQuerySchema = z.object({
  query: z.string().min(1),
  adapter: z.string().min(1),
  snapshot: z.string().min(1),
  assembledAt: z.iso.datetime(),
  matched: z.number().int().nonnegative(),
});

/**
 * The pack. Two of the four rules are plain field rules, and two are
 * refinements, because no single field is wrong on its own (lesson 0007).
 *
 *   assembledFrom.min(1)  — a pack nobody assembled is not a pack.
 *   items.min(1)          — "no pack, no dispatch" as a parse. A job that
 *                           asked questions and got no answers is refused
 *                           before a token is spent.
 *   one snapshot          — items from two snapshots of the graph may
 *                           contradict each other, and the pack could not
 *                           say which one the job believed.
 *   each id once          — two queries can match the same node. A pack
 *                           that cites it twice pays twice in tokens and
 *                           reads as two independent confirmations.
 */
const PackShape = z.object({
  /** The job this pack was assembled for, by title. */
  job: z.string().min(1),
  assembledFrom: z.array(PackQuerySchema).min(1),
  /** Nested, so every rule of lesson 0014's evidence schema runs here. */
  items: z.array(EvidenceItemSchema).min(1),
});

type PackShape = z.infer<typeof PackShape>;

/** Every query was answered from the same snapshot of the graph. */
const oneSnapshot = (pack: PackShape): boolean =>
  new Set(pack.assembledFrom.map((row) => row.snapshot)).size === 1;

/** No id appears twice, however many queries matched it. */
const idsAreUnique = (pack: PackShape): boolean =>
  new Set(pack.items.map((item) => item.id)).size === pack.items.length;

export const ContextPackSchema = PackShape
  .refine(oneSnapshot, {
    error: "a pack must be assembled from one snapshot of the graph",
    path: ["assembledFrom"],
  })
  .refine(idsAreUnique, {
    error: "a pack may cite each id once",
    path: ["items"],
  });

export type ContextPack = z.infer<typeof ContextPackSchema>;
export type PackQuery = z.infer<typeof PackQuerySchema>;

/** S2's answer, shaped like S1's (lesson 0007's `Admission`). */
export type PackAdmission =
  | { admitted: true; pack: ContextPack }
  | { admitted: false; rejections: string[] };

/** THE GATE. `raw` is `unknown`, so no caller can skip the parse. */
export function admitContextPack(raw: unknown): PackAdmission {
  const parsed = ContextPackSchema.safeParse(raw);
  if (!parsed.success) return { admitted: false, rejections: formatIssues(parsed.error) };
  return { admitted: true, pack: parsed.data };
}

// ── The assembler ───────────────────────────────────────────────────────

/**
 * Query the port once per spec entry and merge the answers.
 *
 * Merging is first-wins on the id, so query order decides which claim text
 * a repeated node contributes. Nothing here decides admissibility: it
 * builds a candidate typed `unknown` and hands it to the parse.
 *
 * A port that throws becomes a rejection naming the query. A question that
 * cannot be asked is a reason the pack is inadmissible, and the supervisor
 * then refuses to dispatch. An exception crossing the wiring instead would
 * end the job with no classified outcome.
 */
export async function assembleContextPack(
  evidence: EvidencePort,
  spec: TaskSpec,
): Promise<PackAdmission> {
  const assembledFrom: PackQuery[] = [];
  const items: EvidenceItem[] = [];
  const seen = new Set<string>();

  for (const query of spec.evidenceQueries) {
    let bundle: EvidenceBundle;
    try {
      bundle = await evidence.search(query, spec.evidenceLimit);
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      return { admitted: false, rejections: [`query "${query}" failed: ${detail}`] };
    }

    assembledFrom.push({
      query,
      adapter: bundle.assembledBy.adapter,
      snapshot: bundle.assembledBy.snapshot,
      assembledAt: bundle.assembledAt,
      matched: bundle.items.length,
    });

    for (const item of bundle.items) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      items.push(item);
    }
  }

  const candidate: unknown = { job: spec.title, assembledFrom, items };
  return admitContextPack(candidate);
}

// ── What the loop reads ─────────────────────────────────────────────────

/**
 * The pack as the model will read it.
 *
 * One line per item: the canonical id, the claim, its confidence label and
 * its sources. The closing line is the instruction that makes the ids
 * useful — cite one, or say the graph does not answer.
 *
 * The text is deterministic. Two runs over the same snapshot render the
 * same characters, which is what makes the trace's character count a
 * number you can compare across runs.
 */
export function renderPack(pack: ContextPack): string {
  const { snapshot } = packHeader(pack);
  const lines = pack.items.map((item) => {
    const refs = item.provenance.sources.map((s) => `${s.kind}:${s.ref}`).join(", ");
    return `[${item.id}] ${item.claim} (${item.provenance.confidence}; ${refs})`;
  });
  return [
    `EVIDENCE from ${snapshot}, ${pack.items.length} item(s) for: ` +
      pack.assembledFrom.map((s) => `${s.query} (${s.matched})`).join(", "),
    ...lines,
    "Cite an id from this list for every claim you make about the graph.",
    "If the list does not answer the question, say so instead of guessing.",
  ].join("\n");
}

/**
 * Split the pack into the two halves the supervisor needs: text for the
 * model, and a reference for the trace. The supervisor never sees an item,
 * a source kind or a confidence label.
 */
export function packForDispatch(pack: ContextPack): AdmittedPack {
  const { snapshot, assembledAt } = packHeader(pack);
  return {
    text: renderPack(pack),
    queries: pack.assembledFrom.map((row) => row.query),
    snapshot,
    assembledAt,
    ids: pack.items.map((item) => item.id),
  };
}

/**
 * The snapshot and moment the whole pack belongs to.
 *
 * `assembledFrom.min(1)` and the one-snapshot rule together mean the first
 * row speaks for every row. Indexing is still `| undefined` to the compiler
 * (`noUncheckedIndexedAccess`), so the fallbacks exist to satisfy it and are
 * written once rather than twice.
 */
function packHeader(pack: ContextPack): { snapshot: string; assembledAt: string } {
  const first = pack.assembledFrom[0];
  return {
    snapshot: first?.snapshot ?? "(none)",
    assembledAt: first?.assembledAt ?? new Date(0).toISOString(),
  };
}
