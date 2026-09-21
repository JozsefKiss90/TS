/**
 * The whole server, under a real MCP client, with no process and no pipe.
 *
 * `InMemoryTransport.createLinkedPair()` gives one client and one server
 * a shared channel inside this process. The frames are the same JSON-RPC
 * messages stdio would carry. What is missing is only the pipe, so a test
 * here proves the protocol and the handler, and says nothing about spawn
 * or stdout discipline. `client-stdio.test.ts` covers those.
 *
 * The graph behind the port is a fake. Lesson 0014's break experiment 1
 * (a malformed answer) becomes a test here, with no edit to the server.
 */
import { Client, InMemoryTransport } from "@modelcontextprotocol/client";
import { describe, expect, it } from "vitest";
import { buildServer } from "../src/build-server.js";
import { EvidenceBundleSchema, type EvidenceItem } from "../src/evidence.js";
import { FakeKnowledgeGraph } from "../src/fake-graph.js";
import type { KnowledgeGraph } from "../src/graph-port.js";
import { item } from "./helpers.js";

/** One client connected to one server over the fake, in this process. */
async function connect(graph: KnowledgeGraph): Promise<Client> {
  const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: "test", version: "0.0.0" });
  await buildServer(graph).connect(serverSide);
  await client.connect(clientSide);
  return client;
}

const ITEMS: EvidenceItem[] = [
  item("MOD-001", "ModelGateway port is implemented (module)."),
  item("MOD-005", "Approval gate is implemented (module)."),
  item("MOD-006", "JSON Lines trace is implemented (module)."),
];

describe("search_evidence over the fake, in memory", () => {
  it("advertises the output schema in tools/list", async () => {
    const client = await connect(new FakeKnowledgeGraph(ITEMS));
    const { tools } = await client.listTools();
    const tool = tools.find((t) => t.name === "search_evidence");
    expect(tool?.outputSchema).toBeDefined();
    const json = JSON.stringify(tool?.outputSchema);
    expect(json).toContain('"minItems":1');
    expect(json).not.toContain("two sources");
    await client.close();
  });

  it("returns structuredContent the evidence schema admits, and the fake saw the query", async () => {
    const fake = new FakeKnowledgeGraph(ITEMS);
    const client = await connect(fake);
    const result = await client.callTool({ name: "search_evidence", arguments: { query: "gate" } });
    expect(result.isError).toBeFalsy();
    // `unknown` on this side of the wire. The parse makes it a bundle.
    const bundle = EvidenceBundleSchema.parse(result.structuredContent);
    expect(bundle.items.map((i) => i.id)).toEqual(["MOD-001", "MOD-005"]);
    expect(bundle.assembledBy.adapter).toBe("FakeKnowledgeGraph");
    expect(fake.queries).toEqual(["gate"]);
    await client.close();
  });

  it("refuses in-band a bundle whose item claims confirmed on one source", async () => {
    // Typed as an EvidenceItem, so the fake accepts it. The server's
    // output parse runs the refinement and refuses the whole answer.
    const bad = item("MOD-009", "A confirmed claim with one source.", "confirmed");
    const client = await connect(new FakeKnowledgeGraph([bad]));
    const result = await client.callTool({ name: "search_evidence", arguments: { query: "confirmed" } });
    expect(result.isError).toBe(true);
    expect(result.structuredContent).toBeUndefined();
    const text = result.content.map((c) => (c.type === "text" ? c.text : "")).join("");
    expect(text).toMatch(/Output validation error/);
    expect(text).toMatch(/two sources/);
    await client.close();
  });

  it("answers a miss with an empty bundle and no error", async () => {
    const client = await connect(new FakeKnowledgeGraph(ITEMS));
    const result = await client.callTool({ name: "search_evidence", arguments: { query: "kubernetes" } });
    expect(result.isError).toBeFalsy();
    expect(EvidenceBundleSchema.parse(result.structuredContent).items).toEqual([]);
    await client.close();
  });

  it("serves one item as a resource and fails an unknown id as a protocol error", async () => {
    const client = await connect(new FakeKnowledgeGraph(ITEMS));
    const { contents } = await client.readResource({ uri: "graph://evidence/MOD-006" });
    const first = contents[0];
    expect(first?.mimeType).toBe("application/json");
    expect(first && "text" in first ? JSON.parse(String(first.text)).id : undefined).toBe("MOD-006");
    await expect(client.readResource({ uri: "graph://evidence/nope" })).rejects.toThrow(/no evidence/);
    await client.close();
  });
});
