// The RECORDER — `pnpm record` (lesson 0015).
//
// Runs the real adapter over the real export, under a real MCP client, in
// this one process. The client and the server share an in-memory
// transport, so the frames are the ones stdio would carry, minus the pipe.
// Every call's request and parsed answer land in `fixtures/`.
//
// The adapter gets a fixed clock, so `assembledAt` is stable and a
// re-record differs only where the graph or the adapter changed. Only
// `recordedAt` moves on every run. Re-record, then read `git diff`.

import { mkdirSync, writeFileSync } from "node:fs";
import { Client, InMemoryTransport } from "@modelcontextprotocol/client";
import { buildServer } from "./build-server.js";
import { EvidenceBundleSchema } from "./evidence.js";
import { JsonExportAdapter, loadExport } from "./export-adapter.js";
import type { RecordedCall } from "./fixtures.js";

const FIXED_CLOCK = () => "2026-09-10T09:00:00.000Z";
const FIXTURES = new URL("../fixtures/", import.meta.url);

const CALLS: RecordedCall["request"][] = [
  { name: "search_evidence", arguments: { query: "gate" } },
  { name: "search_evidence", arguments: { query: "kubernetes" } },
  { name: "search_evidence", arguments: { query: "trace", limit: 1 } },
];

const graph = new JsonExportAdapter(
  loadExport(new URL("../data/graph-export.json", import.meta.url)),
  FIXED_CLOCK,
);
const server = buildServer(graph);
const client = new Client({ name: "recorder", version: "0.0.0" });
const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();
await server.connect(serverSide);
await client.connect(clientSide);

mkdirSync(FIXTURES, { recursive: true });
for (const request of CALLS) {
  const result = await client.callTool(request);
  if (result.isError) throw new Error(`refused while recording: ${JSON.stringify(result.content)}`);
  // `structuredContent` reaches the client as `unknown`. The parse is what
  // makes it a bundle, and it runs the refinement the wire could not carry.
  const bundle = EvidenceBundleSchema.parse(result.structuredContent);
  const recorded: RecordedCall = { recordedAt: new Date().toISOString(), request, result: bundle };
  const suffix = request.arguments.limit === undefined ? "" : `-limit-${request.arguments.limit}`;
  const name = `search-${request.arguments.query}${suffix}.json`;
  writeFileSync(new URL(name, FIXTURES), JSON.stringify(recorded, null, 2) + "\n");
  console.log(`recorded ${name}: ${bundle.items.length} item(s)`);
}

await client.close();
