// The SCRIPTED CLIENT — `pnpm client` (lesson 0015).
//
// Lesson 0013 drove the server with raw frames from a file, then with the
// Inspector. This is the third way: a program. It starts the server as a
// child process on the standard-io transport, runs the initialize
// handshake, and calls the tool the way Hermes will in lesson 0016.
//
// What the SDK does for you: spawn, handshake, id matching, and a JSON
// Schema check of `structuredContent` against what the server advertised
// in tools/list. What it cannot do: run the Zod refinement, because JSON
// Schema never carried it. So the last step is yours: parse the unknown
// with the evidence schema on this side of the wire.

import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";
import { EvidenceBundleSchema } from "./evidence.js";

const client = new Client({ name: "scripted-client", version: "0.1.0" });
const transport = new StdioClientTransport({
  // The same process `pnpm server` starts. Node runs the TypeScript through
  // tsx; the server's stderr is inherited, so its "serving" line shows here.
  command: process.execPath,
  args: ["--import", "tsx", "src/server.ts"],
  cwd: fileURLToPath(new URL("..", import.meta.url)),
});

const started = performance.now();
await client.connect(transport);
const ms = (performance.now() - started).toFixed(0);
console.log(`connected to ${client.getServerVersion()?.name} in ${ms} ms`);

const { tools } = await client.listTools();
for (const tool of tools) {
  const has = tool.outputSchema === undefined ? "absent" : "present";
  console.log(`tool ${tool.name}: outputSchema ${has}`);
}

for (const query of ["gate", "kubernetes"]) {
  const result = await client.callTool({ name: "search_evidence", arguments: { query } });
  if (result.isError) {
    console.log(`refused: ${JSON.stringify(result.content)}`);
    continue;
  }
  const bundle = EvidenceBundleSchema.parse(result.structuredContent);
  const by = `${bundle.assembledBy.adapter}@${bundle.assembledBy.snapshot}`;
  console.log(`search "${query}": ${bundle.items.length} item(s) from ${by}`);
  for (const item of bundle.items) {
    const n = item.provenance.sources.length;
    console.log(`  ${item.id} [${item.provenance.confidence}] ${n} source(s)`);
  }
}

const { contents } = await client.readResource({ uri: "graph://evidence/MOD-001" });
const text = contents[0] && "text" in contents[0] ? String(contents[0].text) : "";
console.log(`resource MOD-001: ${contents[0]?.mimeType}, ${text.length} bytes`);

await client.close();
console.log("closed; the server process ends with the pipe");
