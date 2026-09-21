/**
 * The one test that spawns. Everything the in-memory suite proves, this
 * proves again over a real child process and a real pipe, and it adds the
 * two things only a pipe can show: the server starts from its wiring, and
 * its stdout carries frames and nothing else.
 *
 * It is the slowest test in the folder by two orders of magnitude, which
 * is the reason there is one of it.
 */
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";
import { describe, expect, it } from "vitest";
import { EvidenceBundleSchema } from "../src/evidence.js";

describe("the server as a child process on stdio", () => {
  it("starts, answers the handshake, serves the tool, and stops with the pipe", async () => {
    const client = new Client({ name: "stdio-test", version: "0.0.0" });
    const transport = new StdioClientTransport({
      command: process.execPath,
      args: ["--import", "tsx", "src/server.ts"],
      cwd: fileURLToPath(new URL("..", import.meta.url)),
      stderr: "pipe",
    });
    await client.connect(transport);
    expect(client.getServerVersion()?.name).toBe("dev-graph-evidence");

    const result = await client.callTool({ name: "search_evidence", arguments: { query: "gate" } });
    const bundle = EvidenceBundleSchema.parse(result.structuredContent);
    expect(bundle.items.map((i) => i.id)).toEqual(["MOD-001", "MOD-003", "MOD-005"]);
    expect(bundle.assembledBy.adapter).toBe("JsonExportAdapter");

    await client.close();
    expect(transport.pid).toBeNull();
  }, 20_000);
});
