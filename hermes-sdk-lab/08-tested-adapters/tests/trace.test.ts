/**
 * The trace reader and the resume rebuild, tested on values built in the
 * test itself. Lesson 0011 measured these against files on disk; here the
 * same code runs against strings, because parseTrace never knew about
 * files in the first place — the sink and the disk were the wiring's.
 */
import { describe, expect, it } from "vitest";
import type { TraceEvent } from "../../07-tool-loop/src/trace.js";
import { parseTrace, rebuildResumePoint } from "../../07-tool-loop/src/trace.js";

const events: TraceEvent[] = [
  {
    kind: "job_started",
    at: 1,
    title: "Audit the atlas graph",
    owner: "themis",
    instruction: "Audit the atlas graph and summarize its health.",
    costCeilingTokens: 600,
  },
  { kind: "call_started", at: 2, call: 1 },
  {
    kind: "reply",
    at: 3,
    call: 1,
    stop: "wants_tool",
    text: "I need the graph health report first.",
    calls: [{ id: "toolu_1", name: "graph_health", input: { graph: "atlas" } }],
    inputTokens: 23,
    outputTokens: 42,
    requestId: "req_mock_0001",
  },
  { kind: "gate", at: 4, call: 1, tool: "graph_health", decision: "auto" },
  {
    kind: "tool_result",
    at: 5,
    id: "toolu_1",
    tool: "graph_health",
    failed: false,
    output: "graph=atlas nodes=1284 orphans=3 stale_edges=2",
  },
  { kind: "call_started", at: 6, call: 2 },
  { kind: "job_ended", at: 7, outcome: "out_of_time", modelCalls: 2, tokensSpent: 183, notes: [] },
];

const asFile = (list: TraceEvent[]): string =>
  list.map((event) => JSON.stringify(event)).join("\n");

describe("parseTrace", () => {
  it("reads back every line it wrote", () => {
    const lines = parseTrace(asFile(events));

    expect(lines).toHaveLength(7);
    expect(lines.every((line) => line.ok)).toBe(true);
  });

  it("refuses a tampered line with its number, and the rest still read", () => {
    const tampered = asFile(events).replace('"tokensSpent":183', '"tokensSpent":"183"');
    const lines = parseTrace(tampered);

    const refused = lines.filter((line) => !line.ok);
    expect(refused).toHaveLength(1);
    expect(refused[0]).toMatchObject({ line: 7 });
    expect(lines.filter((line) => line.ok)).toHaveLength(6);
  });

  it("refuses a line that is not JSON at all", () => {
    const lines = parseTrace(`${asFile(events)}\nnot json`);

    expect(lines[7]).toMatchObject({ ok: false, reason: "not JSON" });
  });
});

describe("rebuildResumePoint", () => {
  it("rebuilds the transcript, the ledger and the call count from events alone", () => {
    const resume = rebuildResumePoint(events);

    expect(resume).not.toBeNull();
    if (resume === null) return;
    expect(resume.transcript.map((turn) => turn.from)).toEqual(["operator", "model", "tools"]);
    // job_ended's figure includes the aborted call's estimated spend, which
    // the reply events alone cannot see.
    expect(resume.tokensSpent).toBe(183);
    // The aborted call was billed, so it counts.
    expect(resume.modelCalls).toBe(2);
  });

  it("drops a trailing model ask whose tool calls were never answered", () => {
    const cut = events.slice(0, 3);
    const resume = rebuildResumePoint(cut);

    expect(resume).not.toBeNull();
    if (resume === null) return;
    expect(resume.transcript.map((turn) => turn.from)).toEqual(["operator"]);
  });

  it("returns null when no job_started exists to rebuild from", () => {
    expect(rebuildResumePoint(events.slice(1))).toBeNull();
  });
});
