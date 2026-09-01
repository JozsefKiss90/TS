/**
 * The adapter under recorded fixtures — the three translations of lesson
 * 0008, proven against real captured bytes instead of a listening mock.
 *
 * The client's baseURL points at a host that does not resolve. If any test
 * here reaches for a socket, it fails; that the suite passes is the proof
 * that it never does.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import Anthropic from "@anthropic-ai/sdk";
import { describe, expect, it } from "vitest";
import { AnthropicModelGateway } from "../../07-tool-loop/src/anthropic-gateway.js";
import type { ModelCall } from "../../07-tool-loop/src/gateway.js";
import { admitTaskSpec, type TaskSpec } from "../../07-tool-loop/src/task-spec.js";
import { offerTools } from "../../07-tool-loop/src/tools.js";
import { loadExchange, replayFetch, type RecordedExchange } from "../src/replay.js";

const MODEL = "claude-opus-4-8";

/** The wiring, minus the network. maxRetries is 0 so a replayed 429 is
 * classified instead of retried against an exhausted script. */
function offlineGateway(exchanges: RecordedExchange[]): {
  gateway: AnthropicModelGateway;
  sent: ReturnType<typeof replayFetch>["sent"];
} {
  const { fetch, sent } = replayFetch(exchanges);
  const client = new Anthropic({
    baseURL: "http://offline.invalid",
    apiKey: "mock-key-any-value-passes",
    maxRetries: 0,
    fetch,
  });
  return { gateway: new AnthropicModelGateway(client, MODEL), sent };
}

/** The same spec the fixtures were recorded under: exercise 07 Part A's. */
function auditSpec(): TaskSpec {
  const text = readFileSync(
    fileURLToPath(new URL("../../07-tool-loop/specs/audit-atlas.json", import.meta.url)),
    "utf8",
  );
  const admission = admitTaskSpec(JSON.parse(text));
  if (!admission.admitted) throw new Error(admission.rejections.join("; "));
  return admission.spec;
}

/** Call 1 of the audit job, as the supervisor would build it. */
function firstCall(spec: TaskSpec): ModelCall {
  return {
    transcript: [{ from: "operator", text: spec.instruction }],
    maxTokens: spec.maxTokens,
    tools: offerTools(spec.allowedTools),
  };
}

describe("translation 1: the request", () => {
  it("sends the recorded request again, byte for byte", async () => {
    const exchange = loadExchange("tool-ask");
    const { gateway, sent } = offlineGateway([exchange]);
    await gateway.complete(firstCall(auditSpec()));

    expect(sent[0]?.path).toBe("/v1/messages");
    expect(sent[0]?.body).toBe(exchange.request.body);
    expect(sent[0]?.headers["x-api-key"]).toBe(exchange.request.headers["x-api-key"]);
    expect(sent[0]?.headers["anthropic-version"]).toBe(exchange.request.headers["anthropic-version"]);
  });

  it("omits the tools key entirely when the job permits none", async () => {
    const { gateway, sent } = offlineGateway([loadExchange("tool-ask")]);
    const spec = auditSpec();
    await gateway.complete({ ...firstCall(spec), tools: [] });

    expect(sent[0]?.body).not.toContain('"tools"');
  });
});

describe("translation 2: the reply", () => {
  it("assembles the streamed fixture into a proven ModelReply", async () => {
    const { gateway } = offlineGateway([loadExchange("tool-ask")]);
    const result = await gateway.complete(firstCall(auditSpec()));

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.reply.stop).toBe("wants_tool");
    expect(result.reply.text).toBe("I need the graph health report first.");
    expect(result.reply.calls).toEqual([
      { id: "toolu_mock_0001", name: "graph_health", input: { graph: "atlas" } },
    ]);
    expect(result.reply.usage).toEqual({ inputTokens: 23, outputTokens: 42 });
    // The one value Hermes and the provider share (lesson 0011).
    expect(result.reply.requestId).toBe("req_mock_0001");
  });

  it("refuses a stop_reason outside the wire contract at the boundary", async () => {
    const { gateway } = offlineGateway([loadExchange("drifted-stop")]);
    const result = await gateway.complete(firstCall(auditSpec()));

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.failure.kind).toBe("malformed_reply");
    if (result.failure.kind !== "malformed_reply") return;
    expect(result.failure.issues.join(" ")).toContain("stop_reason");
  });
});

describe("translation 3: the failures", () => {
  it("classifies a recorded 429 as throttled, with the header's backoff", async () => {
    const { gateway } = offlineGateway([loadExchange("throttled")]);
    const result = await gateway.complete(firstCall(auditSpec()));

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.failure).toEqual({ kind: "throttled", retryAfterMs: 5000 });
  });

  it("classifies a recorded 401 as rejected, with the status kept", async () => {
    const { gateway } = offlineGateway([loadExchange("no-auth")]);
    const result = await gateway.complete(firstCall(auditSpec()));

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.failure).toMatchObject({ kind: "rejected", status: 401 });
  });
});
