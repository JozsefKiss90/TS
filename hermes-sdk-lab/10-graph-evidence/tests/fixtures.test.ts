/**
 * Recorded fixtures, read back and replayed.
 *
 * `pnpm record` wrote these files by running the real adapter under a real
 * client. A test here builds a fake from a fixture's items, serves it, and
 * checks that the answer the client gets matches the recording. Reading a
 * fixture is a parse, so a tampered file is refused before any replay.
 */
import { readFileSync } from "node:fs";
import { Client, InMemoryTransport } from "@modelcontextprotocol/client";
import { describe, expect, it } from "vitest";
import { buildServer } from "../src/build-server.js";
import { EvidenceBundleSchema } from "../src/evidence.js";
import { FakeKnowledgeGraph } from "../src/fake-graph.js";
import { loadFixture, parseFixture, type RecordedCall } from "../src/fixtures.js";

const GATE = new URL("../fixtures/search-gate.json", import.meta.url);
const MISS = new URL("../fixtures/search-kubernetes.json", import.meta.url);
const LIMIT = new URL("../fixtures/search-trace-limit-1.json", import.meta.url);

function rawFixture(path: URL): Record<string, unknown> {
  return JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>;
}

/** A fake that holds the recorded items, served to one in-memory client. */
async function replay(recording: RecordedCall): Promise<Client> {
  const { assembledBy, assembledAt, items } = recording.result;
  const fake = new FakeKnowledgeGraph(items, assembledBy.snapshot, () => assembledAt);
  const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: "replay", version: "0.0.0" });
  await buildServer(fake).connect(serverSide);
  await client.connect(clientSide);
  return client;
}

describe("fixtures — the parse on the way in", () => {
  it("admits the three shipped fixtures", () => {
    expect(loadFixture(GATE).result.items).toHaveLength(3);
    expect(loadFixture(MISS).result.items).toHaveLength(0);
    expect(loadFixture(LIMIT).result.items).toHaveLength(1);
  });

  it("refuses a source kind outside the closed list", () => {
    const raw = rawFixture(GATE);
    const items = (raw["result"] as { items: Array<{ provenance: { sources: Array<{ kind: string }> } }> }).items;
    items[0]!.provenance.sources[0]!.kind = "blog";
    const parsed = parseFixture(raw);
    expect(parsed.ok).toBe(false);
    if (parsed.ok) return;
    expect(parsed.issues).toMatch(/result\.items\[0\]\.provenance\.sources\[0\]\.kind/);
  });

  it("runs the two-sources refinement on read, which the wire never carried", () => {
    const raw = rawFixture(GATE);
    const items = (raw["result"] as { items: Array<{ provenance: { confidence: string } }> }).items;
    // MOD-003 was recorded single-source with one source. Promote it by hand.
    items[1]!.provenance.confidence = "confirmed";
    const parsed = parseFixture(raw);
    expect(parsed.ok).toBe(false);
    if (parsed.ok) return;
    expect(parsed.issues).toMatch(/two sources/);
  });
});

describe("fixtures — replay through the server", () => {
  it("serves the recorded items back through the real tool, unchanged", async () => {
    const recording = loadFixture(GATE);
    const client = await replay(recording);
    const result = await client.callTool(recording.request);
    const bundle = EvidenceBundleSchema.parse(result.structuredContent);
    expect(bundle.items).toEqual(recording.result.items);
    expect(bundle.assembledAt).toBe(recording.result.assembledAt);
    // The one field that differs: who assembled the bundle this time.
    expect(bundle.assembledBy).toEqual({ adapter: "FakeKnowledgeGraph", snapshot: recording.result.assembledBy.snapshot });
    await client.close();
  });

  it("honours the recorded limit", async () => {
    const recording = loadFixture(LIMIT);
    const client = await replay(recording);
    const result = await client.callTool(recording.request);
    const bundle = EvidenceBundleSchema.parse(result.structuredContent);
    expect(bundle.items.map((i) => i.id)).toEqual(recording.result.items.map((i) => i.id));
    await client.close();
  });
});
