/**
 * The capstone: exercise 07 Part A's whole job — spec admission, both
 * model calls, the gate, the tool, the trace — through the REAL adapter,
 * against recorded bytes, with no process listening anywhere.
 *
 * Every number asserted here is a number a lesson measured live: 217
 * tokens (lesson 0008 Part A), eight trace events (lesson 0011 Part J).
 * If a refactor changes one of them, this test is where the change has to
 * argue its case.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import Anthropic from "@anthropic-ai/sdk";
import { describe, expect, it } from "vitest";
import { AnthropicModelGateway } from "../../07-tool-loop/src/anthropic-gateway.js";
import { runTask } from "../../07-tool-loop/src/supervisor.js";
import { admitTaskSpec } from "../../07-tool-loop/src/task-spec.js";
import type { TraceEvent, TracePort } from "../../07-tool-loop/src/trace.js";
import { loadExchange, replayFetch } from "../src/replay.js";

describe("the whole loop, offline", () => {
  it("reproduces the audit job from the two recorded exchanges", async () => {
    const ask = loadExchange("tool-ask");
    const answered = loadExchange("tool-answered");
    const { fetch, sent } = replayFetch([ask, answered]);
    const client = new Anthropic({
      baseURL: "http://offline.invalid",
      apiKey: "mock-key-any-value-passes",
      maxRetries: 0,
      fetch,
    });
    const gateway = new AnthropicModelGateway(client, "claude-opus-4-8");

    const specText = readFileSync(
      fileURLToPath(new URL("../../07-tool-loop/specs/audit-atlas.json", import.meta.url)),
      "utf8",
    );
    const admission = admitTaskSpec(JSON.parse(specText));
    expect(admission.admitted).toBe(true);
    if (!admission.admitted) return;

    const events: TraceEvent[] = [];
    const trace: TracePort = { append: (event) => events.push(event) };
    const report = await runTask(gateway, admission.spec, { trace });

    // The report lesson 0008 measured live, reproduced without a network.
    expect(report.outcome).toBe("landed");
    expect(report.modelCalls).toBe(2);
    expect(report.toolRuns).toEqual(["graph_health → ran"]);
    expect(report.tokensSpent).toBe(217);

    // The supervisor REGENERATED call 2's request from call 1's replayed
    // reply, and it matches the recorded bytes. That is the loop's whole
    // chain — transcript, pairing id, tool output — holding at once.
    expect(sent[1]?.body).toBe(answered.request.body);

    // The eight events lesson 0011 Part J counted, in the same order.
    expect(events.map((event) => event.kind)).toEqual([
      "job_started",
      "call_started",
      "reply",
      "gate",
      "tool_result",
      "call_started",
      "reply",
      "job_ended",
    ]);
  });
});
