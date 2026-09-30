/**
 * The loop, grounded (lesson 0016).
 *
 * The model is a fake, the graph is a fake, and everything between them is
 * real: a client, a server, the tool, the output parse, the pack's
 * admission, the supervisor, the trace. No network, no key, no pipe.
 */
import { Client, InMemoryTransport } from "@modelcontextprotocol/client";
import { describe, expect, it } from "vitest";
import { FakeModelGateway } from "../../07-tool-loop/src/fake-gateway.js";
import type { GatewayResult } from "../../07-tool-loop/src/gateway.js";
import { runTask } from "../../07-tool-loop/src/supervisor.js";
import type { TraceEvent, TracePort } from "../../07-tool-loop/src/trace.js";
import { buildServer } from "../../10-graph-evidence/src/build-server.js";
import { FakeKnowledgeGraph } from "../../10-graph-evidence/src/fake-graph.js";
import { item } from "../../10-graph-evidence/tests/helpers.js";
import { assembleContextPack, packForDispatch } from "../src/context-pack.js";
import { McpEvidenceAdapter } from "../src/mcp-evidence.js";
import { spec } from "./helpers.js";

const SUPERVISOR = item("MOD-004", "Job supervisor loop is implemented (module).");
const TRACE = item("MOD-006", "JSON Lines trace is implemented (module).");

/** One reply that answers and stops. Enough to reach the first turn. */
const answered: GatewayResult = {
  ok: true,
  reply: {
    text: "MOD-004 and MOD-006 are implemented.",
    calls: [],
    stop: "completed",
    usage: { inputTokens: 300, outputTokens: 20 },
    requestId: "req_fake_0016",
  },
};

function collector(): { port: TracePort; events: TraceEvent[] } {
  const events: TraceEvent[] = [];
  return { port: { append: (event) => void events.push(event) }, events };
}

async function packOverMcp(queries: string[]) {
  const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: "test-supervisor", version: "0.0.0" });
  await buildServer(new FakeKnowledgeGraph([SUPERVISOR, TRACE], "snap-test")).connect(serverSide);
  await client.connect(clientSide);
  const admission = await assembleContextPack(
    new McpEvidenceAdapter(client),
    spec({ evidenceQueries: queries }),
  );
  await client.close();
  if (!admission.admitted) throw new Error(admission.rejections.join("; "));
  return packForDispatch(admission.pack);
}

describe("a grounded job", () => {
  it("sends the pack in the first turn, before the instruction", async () => {
    const pack = await packOverMcp(["supervisor", "trace"]);
    const gateway = new FakeModelGateway([answered]);

    const report = await runTask(gateway, spec({ evidenceQueries: ["supervisor", "trace"] }), {
      pack,
    });

    expect(report.outcome).toBe("landed");
    expect(report.evidenceIds).toEqual(["MOD-004", "MOD-006"]);

    const first = gateway.calls[0]?.transcript[0];
    expect(first?.from).toBe("operator");
    const sent = first !== undefined && first.from === "operator" ? first.text : "";
    expect(sent).toContain("[MOD-004]");
    expect(sent).toContain("Summarize the atlas graph health check");
    // Evidence first, the operator's question last.
    expect(sent.indexOf("[MOD-004]")).toBeLessThan(sent.indexOf("Summarize"));
  });

  it("records which evidence it used, and not what the evidence said", async () => {
    const pack = await packOverMcp(["supervisor", "trace"]);
    const { port, events } = collector();

    await runTask(
      new FakeModelGateway([answered]),
      spec({ evidenceQueries: ["supervisor", "trace"] }),
      { pack, trace: port },
    );

    expect(events.map((event) => event.kind)).toEqual([
      "job_started",
      "evidence_used",
      "call_started",
      "reply",
      "job_ended",
    ]);

    const used = events.find((event) => event.kind === "evidence_used");
    expect(used?.kind).toBe("evidence_used");
    if (used?.kind !== "evidence_used") return;
    expect(used.ids).toEqual(["MOD-004", "MOD-006"]);
    expect(used.snapshot).toBe("snap-test");
    expect(used.chars).toBe(pack.text.length);

    // The separation, as an assertion: the ids are in the trace and the
    // claims are not. To read them back you go to the graph with these ids
    // and this snapshot.
    const written = JSON.stringify(events);
    expect(written).toContain("MOD-004");
    expect(written).not.toContain("Job supervisor loop is implemented");
  });

  it("does not dispatch a job whose evidence never arrived", async () => {
    const gateway = new FakeModelGateway([answered]);
    const { port, events } = collector();

    const report = await runTask(gateway, spec({ evidenceQueries: ["supervisor"] }), {
      trace: port,
    });

    expect(report.outcome).toBe("no_evidence");
    expect(report.modelCalls).toBe(0);
    expect(report.evidenceIds).toEqual([]);
    // The measurement that matters: the model was never asked anything.
    expect(gateway.calls).toHaveLength(0);
    expect(events.map((event) => event.kind)).toEqual(["job_started", "job_ended"]);
  });

  it("refuses a pack that answers questions the spec did not ask", async () => {
    // The pack is well formed and admitted. It is simply not this job's.
    const pack = await packOverMcp(["supervisor", "trace"]);
    const gateway = new FakeModelGateway([answered]);
    const { port, events } = collector();

    const report = await runTask(gateway, spec({ evidenceQueries: ["supervisor"] }), {
      pack,
      trace: port,
    });

    expect(report.outcome).toBe("no_evidence");
    expect(report.modelCalls).toBe(0);
    expect(gateway.calls).toHaveLength(0);
    expect(report.notes.join(" ")).toContain("the pack answers [supervisor, trace]");
    // Never rendered, and never recorded as evidence this job used.
    expect(events.some((event) => event.kind === "evidence_used")).toBe(false);
    expect(report.evidenceIds).toEqual([]);
  });

  it("refuses a pack for a spec that asked for no evidence at all", async () => {
    const pack = await packOverMcp(["supervisor", "trace"]);
    const gateway = new FakeModelGateway([answered]);

    const report = await runTask(gateway, spec(), { pack });

    expect(report.outcome).toBe("no_evidence");
    expect(gateway.calls).toHaveLength(0);
    expect(report.notes.join(" ")).toContain("the spec asks for [nothing]");
  });

  it("leaves a job that asks for no evidence exactly as it was", async () => {
    const gateway = new FakeModelGateway([answered]);
    const { port, events } = collector();

    const report = await runTask(gateway, spec(), { trace: port });

    expect(report.outcome).toBe("landed");
    expect(report.evidenceIds).toEqual([]);
    expect(events.some((event) => event.kind === "evidence_used")).toBe(false);
    expect(gateway.calls[0]?.transcript[0]).toEqual({
      from: "operator",
      text: "Summarize the atlas graph health check in three bullet points.",
    });
  });
});
