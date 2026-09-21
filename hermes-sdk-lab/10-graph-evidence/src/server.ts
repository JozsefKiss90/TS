// Exercise 10 — the wiring. Everything the server DOES is in
// build-server.ts, as a function of the port. This file decides which
// adapter stands behind the port and which transport carries the frames.
//
// Two decisions, two lines. A test makes both differently: a fake behind
// the port, and an in-memory transport instead of stdio (lesson 0015).
// The lesson-0013 rules still hold: the transport owns stdout, so
// diagnostics go to stderr, and a closed pipe stops the process.

import { StdioServerTransport } from "@modelcontextprotocol/server/stdio";
import { buildServer } from "./build-server.js";
import { JsonExportAdapter, loadExport } from "./export-adapter.js";
import type { KnowledgeGraph } from "./graph-port.js";

// The only line that knows the evidence is a JSON file.
const graph: KnowledgeGraph = new JsonExportAdapter(
  loadExport(new URL("../data/graph-export.json", import.meta.url)),
);

const server = buildServer(graph);
const transport = new StdioServerTransport();
await server.connect(transport);
console.error("dev-graph-evidence serving on stdio");
