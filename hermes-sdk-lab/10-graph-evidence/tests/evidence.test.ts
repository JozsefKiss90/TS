/**
 * The evidence schema on its own — no file, no server, no port.
 *
 * Every test here is a parse. The schema is the contract that lesson 0015's
 * fixtures and lesson 0016's Context Pack will both be checked against, so
 * the rules it enforces are pinned before anything consumes them.
 */
import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  EvidenceBundleSchema,
  EvidenceItemSchema,
  ProvenanceSchema,
  type EvidenceItem,
} from "../src/evidence.js";

/** A well-formed item: two sources, so `confirmed` is allowed. */
function item(overrides: Partial<EvidenceItem["provenance"]> = {}): unknown {
  return {
    id: "MOD-001",
    claim: "ModelGateway port is implemented (module).",
    provenance: {
      sources: [
        { kind: "code", ref: "07-tool-loop/src/gateway.ts" },
        { kind: "adr", ref: "ADR provider-neutral port" },
      ],
      generatedBy: { activity: "graph-export", at: "2026-09-09T18:00:00Z" },
      derivedFrom: ["dev-graph-2026-09-09#MOD-001"],
      confidence: "confirmed",
      ...overrides,
    },
  };
}

describe("EvidenceItemSchema", () => {
  it("admits a claim that carries all three provenance answers", () => {
    const parsed = EvidenceItemSchema.safeParse(item());
    expect(parsed.success).toBe(true);
  });

  it("refuses confirmed on a single source — the dev_graph promotion rule", () => {
    const parsed = EvidenceItemSchema.safeParse(
      item({ sources: [{ kind: "code", ref: "07-tool-loop/src/gateway.ts" }] }),
    );
    expect(parsed.success).toBe(false);
    if (parsed.success) return;
    const messages = parsed.error.issues.map((i) => i.message);
    expect(messages).toContain("confirmed needs at least two sources");
    expect(parsed.error.issues[0]?.path).toEqual(["provenance", "confidence"]);
  });

  it("admits single-source with one source", () => {
    const parsed = EvidenceItemSchema.safeParse(
      item({
        sources: [{ kind: "code", ref: "07-tool-loop/src/fake-gateway.ts" }],
        confidence: "single-source",
      }),
    );
    expect(parsed.success).toBe(true);
  });

  it("refuses an item with no source at all — a claim must be attributed", () => {
    const parsed = EvidenceItemSchema.safeParse(item({ sources: [], confidence: "speculative" }));
    expect(parsed.success).toBe(false);
  });

  it("refuses a confidence outside the closed list — no numbers, no free text", () => {
    const parsed = EvidenceItemSchema.safeParse(item({ confidence: 0.9 as never }));
    expect(parsed.success).toBe(false);
  });

  it("refuses a generation time that is not an ISO datetime", () => {
    const parsed = EvidenceItemSchema.safeParse(
      item({ generatedBy: { activity: "graph-export", at: "yesterday" } }),
    );
    expect(parsed.success).toBe(false);
  });

  it("defaults derivedFrom to an empty list — the input type differs from the output type", () => {
    const provenance = ProvenanceSchema.parse({
      sources: [{ kind: "wiki", ref: "wiki/terms/port.md" }],
      generatedBy: { activity: "graph-export", at: "2026-09-09T18:00:00Z" },
      confidence: "inferred",
    });
    expect(provenance.derivedFrom).toEqual([]);
  });
});

describe("EvidenceBundleSchema", () => {
  it("admits an empty bundle — a miss is an answer, not an error", () => {
    const parsed = EvidenceBundleSchema.safeParse({
      query: "nothing",
      assembledAt: "2026-09-10T09:00:00Z",
      assembledBy: { adapter: "JsonExportAdapter", snapshot: "dev-graph-2026-09-09" },
      items: [],
    });
    expect(parsed.success).toBe(true);
  });

  it("refuses a bundle that does not say who assembled it or from which snapshot", () => {
    const parsed = EvidenceBundleSchema.safeParse({
      query: "gateway",
      assembledAt: "2026-09-10T09:00:00Z",
      items: [item()],
    });
    expect(parsed.success).toBe(false);
  });

  it("converts to JSON Schema without the refinement — the rule guards the boundary but does not travel", () => {
    const json = JSON.stringify(z.toJSONSchema(EvidenceBundleSchema));
    expect(json).toContain('"confirmed"');
    expect(json).toContain('"minItems":1');
    expect(json).not.toContain("two sources");
  });
});
