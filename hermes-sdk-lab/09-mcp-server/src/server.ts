// Exercise 09 — a minimal MCP server over the miniature graph.
//
// One rule governs every line that touches process.stdout: the stdio
// transport OWNS stdout. Every byte written there must be a JSON-RPC
// frame, so diagnostics go to stderr (console.error) or nowhere.

import { McpServer, ResourceTemplate } from "@modelcontextprotocol/server";
import { StdioServerTransport } from "@modelcontextprotocol/server/stdio";
import { z } from "zod";
import { GRAPH, findNode, searchNodes } from "./graph.js";

const server = new McpServer({ name: "dev-graph-mini", version: "0.1.0" });

// ── Tool ────────────────────────────────────────────────────────────────
// The Zod schema does two jobs. At registration it is converted to JSON
// Schema and shipped to any client that asks (tools/list) — that is how
// a model learns the tool's shape. At call time the SDK parses incoming
// arguments against it BEFORE this handler runs — the boundary rule,
// enforced on the server's side of the wire this time.
server.registerTool(
  "search_nodes",
  {
    description:
      "Search the knowledge graph by substring. Returns matching node ids, " +
      "titles and statuses. Read-only.",
    inputSchema: z.object({
      query: z.string().min(1).describe("Substring to match against node ids and titles"),
      limit: z.number().int().min(1).max(20).default(5),
    }),
  },
  async ({ query, limit }) => {
    const hits = searchNodes(query, limit);
    if (hits.length === 0) {
      // A miss is a result, not an error: the model should read "nothing
      // matched" and move on, so isError stays unset.
      return { content: [{ type: "text", text: `no nodes match "${query}"` }] };
    }
    const lines = hits.map((n) => `${n.id} · ${n.title} · ${n.status}`);
    return { content: [{ type: "text", text: lines.join("\n") }] };
  },
);

// ── Static resource ─────────────────────────────────────────────────────
// A resource is data with a URI, read by the CLIENT's choice — no model
// call decides this. Tools act, resources are looked up.
server.registerResource(
  "graph-index",
  "graph://index",
  {
    title: "Graph index",
    description: "Every node id in the graph, one per line",
    mimeType: "text/plain",
  },
  async (uri) => ({
    contents: [{ uri: uri.href, mimeType: "text/plain", text: GRAPH.map((n) => n.id).join("\n") }],
  }),
);

// ── Resource template ───────────────────────────────────────────────────
// One registration serves one URI per node. The list callback is what
// makes the instances discoverable; without it a client must already
// know each URI.
server.registerResource(
  "graph-node",
  new ResourceTemplate("graph://node/{id}", {
    list: async () => ({
      resources: GRAPH.map((n) => ({ uri: `graph://node/${n.id}`, name: n.title })),
    }),
  }),
  {
    title: "Graph node",
    description: "One node as JSON",
    mimeType: "application/json",
  },
  async (uri, { id }) => {
    const node = findNode(String(id));
    if (node === undefined) {
      // Unknown URI: throwing here becomes a JSON-RPC error response.
      throw new Error(`no node with id "${String(id)}"`);
    }
    return {
      contents: [{ uri: uri.href, mimeType: "application/json", text: JSON.stringify(node, null, 2) }],
    };
  },
);

// connect() performs the initialize handshake and then serves requests
// until stdin closes. The process stays alive exactly as long as the
// client keeps the pipe open — the client owns this server's lifetime.
const transport = new StdioServerTransport();
await server.connect(transport);
console.error("dev-graph-mini serving on stdio");
