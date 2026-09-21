/**
 * The fake on its own: no server, no transport, no file.
 *
 * A fake is the port's second implementation (lesson 0006). These tests
 * pin what a test may rely on: it answers from its list, it stamps the
 * bundle with its own name, and it remembers what was asked.
 */
import { describe, expect, it } from "vitest";
import { EvidenceBundleSchema } from "../src/evidence.js";
import { FAKE_CLOCK, FakeKnowledgeGraph } from "../src/fake-graph.js";
import { item } from "./helpers.js";

describe("FakeKnowledgeGraph", () => {
  it("answers from its list and stamps the bundle with its own name and clock", async () => {
    const fake = new FakeKnowledgeGraph([item("MOD-001", "ModelGateway port is implemented (module).")]);
    const bundle = await fake.search("gateway", 5);
    expect(bundle.items.map((i) => i.id)).toEqual(["MOD-001"]);
    expect(bundle.assembledBy).toEqual({ adapter: "FakeKnowledgeGraph", snapshot: "fake-snapshot" });
    expect(bundle.assembledAt).toBe(FAKE_CLOCK());
    expect(EvidenceBundleSchema.safeParse(bundle).success).toBe(true);
  });

  it("records every query in order, so a test can assert what the server asked", async () => {
    const fake = new FakeKnowledgeGraph([]);
    await fake.search("gate", 5);
    await fake.search("kubernetes", 5);
    expect(fake.queries).toEqual(["gate", "kubernetes"]);
  });

  it("misses with an empty bundle and an undefined node, never a throw", async () => {
    const fake = new FakeKnowledgeGraph([item("MOD-001", "ModelGateway port is implemented (module).")]);
    expect((await fake.search("kubernetes", 5)).items).toEqual([]);
    expect(await fake.node("MOD-999")).toBeUndefined();
    expect(await fake.all()).toHaveLength(1);
  });
});
