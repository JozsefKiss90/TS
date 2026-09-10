/**
 * The adapter under the shipped export file, and under bytes that are
 * wrong on purpose.
 *
 * The export is the sixth JSON boundary this course defends: replies (0005),
 * specs (0007), tool arguments (0008), the trace (0011), recorded fixtures
 * (0012), and now a file another language wrote.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { EvidenceBundleSchema } from "../src/evidence.js";
import { JsonExportAdapter, loadExport, parseExport } from "../src/export-adapter.js";

const EXPORT_PATH = new URL("../data/graph-export.json", import.meta.url);
const FIXED_CLOCK = () => "2026-09-10T09:00:00.000Z";

function adapter(): JsonExportAdapter {
  return new JsonExportAdapter(loadExport(EXPORT_PATH), FIXED_CLOCK);
}

/** The file's bytes as untyped JSON, before any parse, so a test can break
 * one field on purpose. */
function rawExport(): Record<string, unknown> {
  return JSON.parse(readFileSync(EXPORT_PATH, "utf8")) as Record<string, unknown>;
}

describe("parseExport — the boundary", () => {
  it("admits the shipped export", () => {
    expect(parseExport(rawExport()).ok).toBe(true);
  });

  it("refuses a row whose confidence is not in dev_graph's closed list", () => {
    const raw = rawExport();
    (raw["nodes"] as Array<Record<string, unknown>>)[0]!["confidence"] = "probably";
    const parsed = parseExport(raw);
    expect(parsed.ok).toBe(false);
    if (parsed.ok) return;
    expect(parsed.issues).toMatch(/nodes\[0\]\.confidence/);
  });

  it("refuses a file with no snapshot name — a bundle could not say where it came from", () => {
    const raw = rawExport();
    delete raw["snapshot"];
    expect(parseExport(raw).ok).toBe(false);
  });
});

describe("JsonExportAdapter — the translation", () => {
  it("translates every row into an item, and the bundle passes the evidence schema", async () => {
    const all = await adapter().all();
    expect(all).toHaveLength(8);
    const bundle = await adapter().search("", 20);
    expect(bundle.items).toEqual(all);
    expect(EvidenceBundleSchema.safeParse(bundle).success).toBe(true);
  });

  it("answers the three provenance questions from the row's own fields", async () => {
    const found = await adapter().node("MOD-001");
    expect(found).toBeDefined();
    expect(found?.claim).toBe("ModelGateway port is implemented (module).");
    expect(found?.provenance.sources).toEqual([
      { kind: "code", ref: "07-tool-loop/src/gateway.ts" },
      { kind: "adr", ref: "ADR provider-neutral port (NOTES 2026-07-29)" },
    ]);
    expect(found?.provenance.generatedBy).toEqual({
      activity: "graph-export",
      at: "2026-09-09T18:00:00Z",
    });
    expect(found?.provenance.derivedFrom).toEqual(["dev-graph-2026-09-09#MOD-001"]);
    expect(found?.provenance.confidence).toBe("confirmed");
  });

  it("stamps the bundle with the adapter, the snapshot and the injected clock", async () => {
    const bundle = await adapter().search("gate", 5);
    expect(bundle.assembledBy).toEqual({ adapter: "JsonExportAdapter", snapshot: "dev-graph-2026-09-09" });
    expect(bundle.assembledAt).toBe("2026-09-10T09:00:00.000Z");
    expect(bundle.items.map((i) => i.id)).toEqual(["MOD-001", "MOD-003", "MOD-005"]);
  });

  it("returns an empty bundle on a miss and never invents an item", async () => {
    const bundle = await adapter().search("kubernetes", 5);
    expect(bundle.items).toEqual([]);
    expect(await adapter().node("MOD-999")).toBeUndefined();
  });

  it("refuses at construction a row that claims confirmed on one source", () => {
    const raw = rawExport();
    (raw["nodes"] as Array<Record<string, unknown>>)[2]!["confidence"] = "confirmed";
    const parsed = parseExport(raw);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(() => new JsonExportAdapter(parsed.value, FIXED_CLOCK)).toThrow(/MOD-003[\s\S]*two sources/);
  });
});
