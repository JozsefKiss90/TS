/**
 * The supervisor under the fake — every policy decision the loop makes,
 * proven without a provider, a socket, or a clock worth waiting on.
 *
 * The fake answers at the port, so these tests prove POLICY: which calls
 * run, which are refused, which wait, and when the loop stops. They cannot
 * prove the wire translation (the adapter tests do) or mid-generation
 * timing (the fake answers instantly; lesson 0009 measured that live).
 */
import { describe, expect, it } from "vitest";
import type { ApprovalPort } from "../../07-tool-loop/src/approval.js";
import { FakeModelGateway } from "../../07-tool-loop/src/fake-gateway.js";
import type { GatewayResult, ModelReply } from "../../07-tool-loop/src/gateway.js";
import { runTask } from "../../07-tool-loop/src/supervisor.js";
import { admitTaskSpec, type TaskSpec, type TaskSpecInput } from "../../07-tool-loop/src/task-spec.js";
import { rebuildResumePoint, type TraceEvent, type TracePort } from "../../07-tool-loop/src/trace.js";

/** A finished reply, with overridable parts. Usage defaults to 10 + 5. */
function reply(overrides: Partial<ModelReply>): GatewayResult {
  return {
    ok: true,
    reply: {
      text: "",
      calls: [],
      stop: "completed",
      usage: { inputTokens: 10, outputTokens: 5 },
      requestId: null,
      ...overrides,
    },
  };
}

const asksForHealth = reply({
  text: "I need the graph health report first.",
  stop: "wants_tool",
  calls: [{ id: "toolu_1", name: "graph_health", input: { graph: "atlas" } }],
});

const asksForWriteback = reply({
  stop: "wants_tool",
  calls: [{ id: "toolu_2", name: "graph_writeback", input: { graph: "atlas", patch: "fix" } }],
});

const done = reply({ text: "Audit complete." });

/** Admit an inline spec, or fail the test that asked for it. */
function spec(overrides: Partial<TaskSpecInput>): TaskSpec {
  const admission = admitTaskSpec({
    title: "Audit the atlas graph",
    owner: "themis",
    instruction: "Audit the atlas graph and summarize its health.",
    costCeilingTokens: 600,
    maxTokens: 500,
    outputPath: "artifacts/audit-atlas.md",
    ...overrides,
  });
  if (!admission.admitted) throw new Error(admission.rejections.join("; "));
  return admission.spec;
}

/** An approver that answers from a script — the ApprovalPort's own fake. */
function scriptedApprover(verdicts: Array<"approved" | "denied">): ApprovalPort {
  const script = [...verdicts];
  return {
    decide: () => Promise.resolve(script.shift() ?? "denied"),
  };
}

describe("runTask with the fake at the port", () => {
  it("lands a job with no tools and books the true usage", async () => {
    const gateway = new FakeModelGateway([done]);
    const report = await runTask(gateway, spec({}));

    expect(report.outcome).toBe("landed");
    expect(report.modelCalls).toBe(1);
    expect(report.tokensSpent).toBe(15);
    expect(report.toolRuns).toEqual([]);
  });

  it("answers a tool call and resends the whole conversation", async () => {
    const gateway = new FakeModelGateway([asksForHealth, done]);
    const report = await runTask(gateway, spec({ allowedTools: ["graph_health"] }));

    expect(report.outcome).toBe("landed");
    expect(report.toolRuns).toEqual(["graph_health → ran"]);
    // The second request carries operator ask, model ask, tool answer.
    expect(gateway.calls[1]?.transcript.map((turn) => turn.from)).toEqual([
      "operator",
      "model",
      "tools",
    ]);
  });

  it("refuses a tool the spec never permitted, and the model is told", async () => {
    const gateway = new FakeModelGateway([asksForWriteback, done]);
    const report = await runTask(gateway, spec({ allowedTools: ["graph_health"] }));

    expect(report.outcome).toBe("landed");
    expect(report.toolRuns).toEqual(["graph_writeback → refused"]);
    const answer = gateway.calls[1]?.transcript[2];
    expect(answer?.from === "tools" && answer.results[0]?.failed).toBe(true);
  });

  it("stops at the spec's call cap when the model never finishes", async () => {
    const gateway = new FakeModelGateway([asksForHealth, asksForHealth]);
    const report = await runTask(
      gateway,
      spec({ allowedTools: ["graph_health"], maxModelCalls: 2 }),
    );

    expect(report.outcome).toBe("gave_up");
    expect(report.modelCalls).toBe(2);
    expect(report.notes.join(" ")).toContain("still wanted a tool after 2 model calls");
  });

  it("blocks the next call once the ledger reaches the ceiling", async () => {
    const expensive = reply({
      stop: "wants_tool",
      calls: [{ id: "toolu_1", name: "graph_health", input: { graph: "atlas" } }],
      usage: { inputTokens: 400, outputTokens: 300 },
    });
    const gateway = new FakeModelGateway([expensive]);
    const report = await runTask(gateway, spec({ allowedTools: ["graph_health"] }));

    expect(report.outcome).toBe("over_budget");
    expect(report.modelCalls).toBe(1);
    expect(report.tokensSpent).toBe(700);
  });

  it("denies a held call by default when no approver is wired", async () => {
    const gateway = new FakeModelGateway([asksForWriteback, done]);
    const report = await runTask(
      gateway,
      spec({
        allowedTools: ["graph_health", "graph_writeback"],
        approvalRequired: ["graph_writeback"],
      }),
    );

    expect(report.toolRuns).toEqual(["graph_writeback → denied by default"]);
  });

  it("runs a held call the operator approves, and refuses one they deny", async () => {
    const gated = spec({
      allowedTools: ["graph_health", "graph_writeback"],
      approvalRequired: ["graph_writeback"],
    });

    const approvedRun = await runTask(new FakeModelGateway([asksForWriteback, done]), gated, {
      approver: scriptedApprover(["approved"]),
    });
    expect(approvedRun.toolRuns).toEqual(["graph_writeback → ran (approved)"]);

    const deniedRun = await runTask(new FakeModelGateway([asksForWriteback, done]), gated, {
      approver: scriptedApprover(["denied"]),
    });
    expect(deniedRun.toolRuns).toEqual(["graph_writeback → denied by the operator"]);
  });

  it("emits the trace in order, with exactly one job_ended", async () => {
    const events: TraceEvent[] = [];
    const trace: TracePort = { append: (event) => events.push(event) };
    const gateway = new FakeModelGateway([asksForHealth, done]);
    await runTask(gateway, spec({ allowedTools: ["graph_health"] }), { trace });

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

  it("resumes from its own trace: ledger and numbering carry", async () => {
    const events: TraceEvent[] = [];
    const trace: TracePort = { append: (event) => events.push(event) };
    const run1 = await runTask(
      new FakeModelGateway([asksForHealth, asksForHealth]),
      spec({ allowedTools: ["graph_health"], maxModelCalls: 2 }),
      { trace },
    );

    const resume = rebuildResumePoint(events);
    expect(resume).not.toBeNull();
    if (resume === null) return;

    const run2 = await runTask(
      new FakeModelGateway([done]),
      spec({ allowedTools: ["graph_health"], maxModelCalls: 3 }),
      { resume },
    );

    expect(run2.outcome).toBe("landed");
    // Two carried calls plus this run's one: the numbering continued.
    expect(run2.modelCalls).toBe(3);
    expect(run2.tokensSpent).toBe(run1.tokensSpent + 15);
  });
});
