// Exercise 10 — the MCP server as a FUNCTION of its graph (lesson 0015).
//
// Lesson 0014 wired the server and registered its tool in one file. That
// file could only ever serve the JSON export, so a test that wanted the
// server over a fake had to edit it. The registration now lives here and
// takes the port as an argument. `server.ts` keeps the wiring and the
// transport; a test passes a fake and an in-memory transport instead.
//
// Nothing below changed in behaviour since lesson 0014: same tool, same
// output schema, same resource template, same refusal channels.

import { McpServer, ResourceTemplate } from "@modelcontextprotocol/server";
import { z } from "zod";
import { EvidenceBundleSchema } from "./evidence.js";
import type { KnowledgeGraph } from "./graph-port.js";

export function buildServer(graph: KnowledgeGraph): McpServer {
  const server = new McpServer({ name: "dev-graph-evidence", version: "0.3.0" });

  // ── Tool ──────────────────────────────────────────────────────────────
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

  // ── Resource template ─────────────────────────────────────────────────
  // One item per canonical id, as JSON, for a client that already knows
  // which node it wants. No model turn is spent (lesson 0013).
  server.registerResource(
    "evidence-item",
    new ResourceTemplate("graph://evidence/{id}", {
      list: async () => ({
        resources: (await graph.all()).map((i) => ({
          uri: `graph://evidence/${i.id}`,
          name: i.claim,
        })),
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
        contents: [
          { uri: uri.href, mimeType: "application/json", text: JSON.stringify(item, null, 2) },
        ],
      };
    },
  );

  return server;
}
