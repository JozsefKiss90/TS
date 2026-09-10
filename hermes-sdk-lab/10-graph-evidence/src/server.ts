// Exercise 10 — the MCP server from exercise 09, now answering with
// evidence that carries provenance.
//
// Same anatomy as 09: one McpServer, one stdio transport, stdout owned by
// the transport. Two things changed.
//
//   1. The tool has an OUTPUT schema. The SDK converts it to JSON Schema
//      for tools/list (so a client learns the answer's shape, not only the
//      question's), and parses `structuredContent` against it AFTER the
//      handler runs. A malformed answer is refused in-band, isError: true,
//      the same channel a bad argument uses.
//   2. The handler calls a port, not the graph file. The wiring at the
//      bottom picks the adapter; the handler never learns where the
//      evidence came from.

import { McpServer, ResourceTemplate } from "@modelcontextprotocol/server";
import { StdioServerTransport } from "@modelcontextprotocol/server/stdio";
import { z } from "zod";
import { EvidenceBundleSchema } from "./evidence.js";
import { JsonExportAdapter, loadExport } from "./export-adapter.js";
import type { KnowledgeGraph } from "./graph-port.js";

// ── Wiring ──────────────────────────────────────────────────────────────
// The only line that knows the evidence is a JSON file. Swap this for a
// Python-backed adapter or a fake and nothing below changes.
const graph: KnowledgeGraph = new JsonExportAdapter(
  loadExport(new URL("../data/graph-export.json", import.meta.url)),
);

const server = new McpServer({ name: "dev-graph-evidence", version: "0.2.0" });

// ── Tool ────────────────────────────────────────────────────────────────
server.registerTool(
  "search_evidence",
  {
    description:
      "Search the knowledge graph by substring. Every item returned carries " +
      "provenance: sources, generating activity, derivation, confidence. " +
      "An empty items list means: not in the graph. Read-only.",
    inputSchema: z.object({
      query: z.string().min(1).describe("Substring to match against ids, slugs and titles"),
      limit: z.number().int().min(1).max(20).default(5),
    }),
    // The evidence schema, unchanged. One source of truth for the port,
    // the adapter's parse, the wire description and the output guard.
    outputSchema: EvidenceBundleSchema,
  },
  async ({ query, limit }) => {
    const bundle = await graph.search(query, limit);
    const summary =
      bundle.items.length === 0
        ? `not in the graph: "${query}"`
        : bundle.items
            .map((i) => `${i.id} · ${i.claim} [${i.provenance.confidence}]`)
            .join("\n");
    // Both channels: text for a model to read, structuredContent for a
    // client to parse. The SDK validates the second against outputSchema.
    return { content: [{ type: "text", text: summary }], structuredContent: bundle };
  },
);

// ── Resource template ───────────────────────────────────────────────────
// One item per canonical id, as JSON, for a client that already knows
// which node it wants. No model turn is spent (lesson 0013).
server.registerResource(
  "evidence-item",
  new ResourceTemplate("graph://evidence/{id}", {
    list: async () => ({
      resources: (await graph.all()).map((i) => ({ uri: `graph://evidence/${i.id}`, name: i.claim })),
    }),
  }),
  {
    title: "Evidence item",
    description: "One claim with its provenance, as JSON",
    mimeType: "application/json",
  },
  async (uri, { id }) => {
    const item = await graph.node(String(id));
    if (item === undefined) {
      // Unknown URI: the client chose it, so this is a protocol error.
      throw new Error(`no evidence for id "${String(id)}"`);
    }
    return {
      contents: [{ uri: uri.href, mimeType: "application/json", text: JSON.stringify(item, null, 2) }],
    };
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("dev-graph-evidence serving on stdio");
