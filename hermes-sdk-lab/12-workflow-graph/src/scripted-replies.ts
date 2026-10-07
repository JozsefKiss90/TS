/**
 * Two scripted replies the fake gateway answers with (lessons 0017, 0018).
 *
 * One asks for the graph_health tool, the other finishes. Together they
 * are the audit job in two calls, and every in-process run in main.ts and
 * the tests is built from them. Shared so the token counts the lessons
 * quote (30, then 50) live once.
 */
import type { GatewayResult } from "../../07-tool-loop/src/gateway.js";

export const wantsTool: GatewayResult = {
  ok: true,
  reply: {
    text: "I need the graph health report first.",
    calls: [{ id: "toolu_1", name: "graph_health", input: { graph: "atlas" } }],
    stop: "wants_tool",
    usage: { inputTokens: 20, outputTokens: 10 },
    requestId: "req_fake_1",
  },
};

export const done: GatewayResult = {
  ok: true,
  reply: {
    text: "Audit complete.",
    calls: [],
    stop: "completed",
    usage: { inputTokens: 40, outputTokens: 10 },
    requestId: "req_fake_2",
  },
};
