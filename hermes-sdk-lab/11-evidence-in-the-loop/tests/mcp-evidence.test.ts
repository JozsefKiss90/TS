/**
 * The evidence path, end to end, with only the graph faked (lesson 0016).
 *
 * A real client, a real server, a real tool registration, a real output
 * parse, over lesson 0015's in-memory transport. `FakeKnowledgeGraph`
 * stands where the JSON export stands in a job, so the items are chosen by
 * the test and nothing reads a file.
 */
import { Client, InMemoryTransport } from "@modelcontextprotocol/client";
import { afterEach, describe, expect, it } from "vitest";
import { buildServer } from "../../10-graph-evidence/src/build-server.js";
import { FakeKnowledgeGraph } from "../../10-graph-evidence/src/fake-graph.js";
import { item } from "../../10-graph-evidence/tests/helpers.js";
import { assembleContextPack, packForDispatch } from "../src/context-pack.js";
import { McpEvidenceAdapter } from "../src/mcp-evidence.js";
import { spec } from "./helpers.js";

const SUPERVISOR = item("MOD-004", "Job supervisor loop is implemented (module).");
const TRACE = item("MOD-006", "JSON Lines trace is implemented (module).");

let open: Client | null = null;

afterEach(async () => {
  await open?.close();
  open = null;
});

/** A real client on a real server, over the in-memory pair. */
async function sourceOver(graph: FakeKnowledgeGraph): Promise<McpEvidenceAdapter> {
  const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: "test-supervisor", version: "0.0.0" });
  await buildServer(graph).connect(serverSide);
  await client.connect(clientSide);
  open = client;
  return new McpEvidenceAdapter(client);
}

describe("the MCP evidence source", () => {
  it("answers one query as a parsed bundle", async () => {
    const graph = new FakeKnowledgeGraph([SUPERVISOR, TRACE], "snap-test");
    const source = await sourceOver(graph);

    const bundle = await source.search("supervisor", 5);

    expect(graph.queries).toEqual(["supervisor"]);
    expect(bundle.assembledBy.snapshot).toBe("snap-test");
    expect(bundle.items.map((i) => i.id)).toEqual(["MOD-004"]);
  });

  it("assembles a pack from two queries across the wire", async () => {
    const graph = new FakeKnowledgeGraph([SUPERVISOR, TRACE], "snap-test");
    const source = await sourceOver(graph);

    const admission = await assembleContextPack(
      source,
      spec({ evidenceQueries: ["supervisor", "trace"], evidenceLimit: 2 }),
    );

    expect(graph.queries).toEqual(["supervisor", "trace"]);
    expect(admission.admitted).toBe(true);
    if (!admission.admitted) return;
    const forLoop = packForDispatch(admission.pack);
    expect(forLoop.ids).toEqual(["MOD-004", "MOD-006"]);
    expect(forLoop.snapshot).toBe("snap-test");
    expect(forLoop.text).toContain("[MOD-006]");
  });

  it("refuses the pack when the graph answers nothing", async () => {
    const source = await sourceOver(new FakeKnowledgeGraph([SUPERVISOR], "snap-test"));

    const admission = await assembleContextPack(source, spec({ evidenceQueries: ["kubernetes"] }));

    expect(admission.admitted).toBe(false);
    if (admission.admitted) return;
    expect(admission.rejections.join(" ")).toContain("items");
  });

  it("turns the server's own refusal into a rejection", async () => {
    // A well-typed item the evidence schema refuses: `confirmed` on one
    // source. The fake does not parse, so the server's output parse is the
    // guard that fires, in-band (lesson 0015, guard 1).
    const overclaimed = item("MOD-003", "FakeModelGateway is implemented (module).", "confirmed");
    const source = await sourceOver(new FakeKnowledgeGraph([overclaimed], "snap-test"));

    const admission = await assembleContextPack(source, spec({ evidenceQueries: ["MOD-003"] }));

    expect(admission.admitted).toBe(false);
    if (admission.admitted) return;
    expect(admission.rejections.join(" ")).toContain("confirmed needs at least two sources");
  });
});
