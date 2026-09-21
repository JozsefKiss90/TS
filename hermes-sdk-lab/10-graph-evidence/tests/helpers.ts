/** Shared by the lesson-0015 suites: one well-formed item, typed, one source. */
import type { EvidenceItem } from "../src/evidence.js";

export function item(
  id: string,
  claim: string,
  confidence: EvidenceItem["provenance"]["confidence"] = "single-source",
): EvidenceItem {
  return {
    id,
    claim,
    provenance: {
      sources: [{ kind: "code", ref: `src/${id.toLowerCase()}.ts` }],
      generatedBy: { activity: "graph-export", at: "2026-09-09T18:00:00Z" },
      derivedFrom: [`fake#${id}`],
      confidence,
    },
  };
}
