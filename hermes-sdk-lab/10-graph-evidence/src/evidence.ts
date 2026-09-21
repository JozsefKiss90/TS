/**
 * The EVIDENCE SCHEMA — what one fact from the knowledge graph looks like
 * once Hermes may believe it (lesson 0014).
 *
 * Designed against W3C PROV-DM (Recommendation, 30 April 2013), which
 * describes provenance with three nouns and a handful of relations. This
 * file keeps three of the relations and renames the nouns into Hermes's
 * vocabulary:
 * 
 *   PROV-DM            here              the question it answers
 *   ─────────────────  ────────────────  ─────────────────────────────────
 *   wasAttributedTo    sources           who is responsible for the claim?
 *   wasGeneratedBy     generatedBy       which activity produced it, when?
 *   wasDerivedFrom     derivedFrom       which earlier record was it made from?
 *
 * PROV-DM's "agent" is the responsible party. That word means something
 * else everywhere in this course, so the field is `sources` and the word
 * agent does not appear below.
 *
 * `confidence` is not PROV-DM. It is dev_graph practice: five closed labels
 * with a promotion rule, never a number. The refinement below is that rule's
 * first step, written as a parse.
 *
 * Domain code: imports zod and nothing else. Where evidence comes from
 * (a file, a Python process, a fake) is the adapter's business.
 */
import { z } from "zod";

/** Who can stand behind a claim. `adr` is dev_graph's `ADR`, lowercased. */
export const SourceKindSchema = z.enum([
  "code",
  "test",
  "adr",
  "design",
  "wiki",
  "benchmark",
  "external",
]);

/** One responsible party: a kind and a reference a human can open. */
export const SourceSchema = z.object({
  kind: SourceKindSchema,
  ref: z.string().min(1),
});

/**
 * dev_graph's closed list, verbatim. A label, not a probability: the graph
 * promotes `single-source` to `confirmed` when a second independent source
 * corroborates, and demotes on contradiction. No arithmetic applies.
 */
export const ConfidenceSchema = z.enum([
  "confirmed",
  "single-source",
  "inferred",
  "speculative",
  "experimental",
]);

/** The activities that can produce an item. A closed list, like the kinds:
 * a client reads this from the wire, so a new activity is a schema change. */
export const ActivitySchema = z.enum(["graph-export"]);

export const ProvenanceSchema = z
  .object({
    /** wasAttributedTo. At least one: an unattributed claim is not evidence. */
    sources: z.array(SourceSchema).min(1),
    /** wasGeneratedBy. The activity and the moment it completed. */
    generatedBy: z.object({
      activity: ActivitySchema,
      at: z.iso.datetime(),
    }),
    /** wasDerivedFrom. References to the records this item was made from. */
    derivedFrom: z.array(z.string().min(1)).default([]),
    confidence: ConfidenceSchema,
  })
  // A cross-field rule, so a refinement (lesson 0007). This is dev_graph's
  // promotion step "single-source → confirmed: a second independent source
  // corroborates", enforced at the boundary instead of by habit.
  .refine((p) => p.confidence !== "confirmed" || p.sources.length >= 2, {
    message: "confirmed needs at least two sources",
    path: ["confidence"],
  });

/** One claim the graph makes, with the record of where it came from. */
export const EvidenceItemSchema = z.object({
  /** The graph's canonical id for the node the claim is about. */
  id: z.string().min(1),
  /** One sentence, templated by the adapter. Never free model text. */
  claim: z.string().min(1),
  provenance: ProvenanceSchema,
});

/**
 * The answer to one query. PROV-DM calls a set of provenance descriptions
 * that is itself an entity a bundle, so that provenance can have provenance.
 * Here that is the header: who assembled these items, from which snapshot,
 * and when.
 */
export const EvidenceBundleSchema = z.object({
  query: z.string(),
  assembledAt: z.iso.datetime(),
  assembledBy: z.object({
    adapter: z.string().min(1),
    snapshot: z.string().min(1),
  }),
  items: z.array(EvidenceItemSchema),
});

// Output types: what a parse returns. `derivedFrom` is always present here,
// and optional on the input side (lesson 0007's `.default()` split).
export type Source = z.infer<typeof SourceSchema>;
export type Confidence = z.infer<typeof ConfidenceSchema>;
export type Provenance = z.infer<typeof ProvenanceSchema>;
export type EvidenceItem = z.infer<typeof EvidenceItemSchema>;
export type EvidenceBundle = z.infer<typeof EvidenceBundleSchema>;
