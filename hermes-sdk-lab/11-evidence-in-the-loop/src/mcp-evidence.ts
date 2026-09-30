/**
 * The ADAPTER — an `EvidencePort` whose answers arrive over MCP
 * (lesson 0016).
 *
 * Above the port: the assembler, which knows queries and packs. Below it:
 * lesson 0015's client, a child process, a transport, and a JSON-RPC
 * request per query. The loop learns none of that. This is lesson 0006's
 * arrangement at a second boundary, and the third adapter in the course to
 * carry an SDK's vocabulary without letting it upward.
 *
 * Two lines do the real work. `callTool` sends one `tools/call` frame and
 * waits for the frame with the same id. `EvidenceBundleSchema.parse` turns
 * `structuredContent`, declared `unknown`, into a bundle. The SDK checked
 * the frame against the JSON Schema it read from `tools/list`, and that
 * schema cannot carry the two-sources rule (measured in lesson 0015), so
 * this parse is where cross-field rules run.
 *
 * Verified against @modelcontextprotocol/client 2.0.0 (pinned exact).
 */
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";
import { EvidenceBundleSchema, type EvidenceBundle } from "../../10-graph-evidence/src/evidence.js";
import type { EvidencePort } from "./context-pack.js";

/** Exercise 10's server, started as a child process on the standard-io pipe. */
const SERVER_CWD = new URL("../../10-graph-evidence/", import.meta.url);

export class McpEvidenceAdapter implements EvidencePort {
  constructor(private readonly client: Client) {}

  /**
   * Spawn exercise 10's server and shake hands. `process.execPath` is this
   * Node binary, so the command works on Windows without a shell.
   */
  static async overStdio(): Promise<McpEvidenceAdapter> {
    const client = new Client({ name: "hermes-supervisor", version: "0.1.0" });
    await client.connect(
      new StdioClientTransport({
        command: process.execPath,
        args: ["--import", "tsx", "src/server.ts"],
        cwd: fileURLToPath(SERVER_CWD),
      }),
    );
    return new McpEvidenceAdapter(client);
  }

  async search(query: string, limit: number): Promise<EvidenceBundle> {
    const result = await this.client.callTool({
      name: "search_evidence",
      arguments: { query, limit },
    });
    // An in-band refusal means the server would not stand behind its own
    // answer. That is a fault in the surface, not a miss: a miss arrives as
    // an empty items list. The assembler turns this into a rejection.
    if (result.isError === true) {
      throw new Error(`search_evidence refused: ${JSON.stringify(result.content)}`);
    }
    return EvidenceBundleSchema.parse(result.structuredContent);
  }

  /** Closing the client closes the pipe, and the server process ends. */
  async close(): Promise<void> {
    await this.client.close();
  }
}
