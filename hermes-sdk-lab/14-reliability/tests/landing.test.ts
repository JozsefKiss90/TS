/**
 * Landing the outputs (lesson 0024), written before the code.
 *
 * Three seams. `buildArtifact` is pure: events in, the artifact out.
 * `landTrace` reads one trace file and writes `artifacts/<run>/`.
 * `runAndLand` wraps one run of lab 12's loop, so every way a run can end
 * leaves a landed artifact behind, except a park, which has not ended.
 *
 * The rule the suite enforces: a run that ends with no artifact fails a
 * test here.
 */
import { existsSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import type { ApprovalPort } from "../../07-tool-loop/src/approval.js";
import { FakeModelGateway } from "../../07-tool-loop/src/fake-gateway.js";
import { parseTrace, type TraceEvent } from "../../07-tool-loop/src/trace.js";
import { spec } from "../../11-evidence-in-the-loop/tests/helpers.js";
import { resumeJob, startJob } from "../../12-workflow-graph/src/handlers.js";
import { loadGraph } from "../../12-workflow-graph/src/load-graph.js";
import { answerParked } from "../../12-workflow-graph/src/queue.js";
import { done, wantsTool } from "../../12-workflow-graph/src/scripted-replies.js";
import { ARTIFACT_FILE, buildArtifact, COST_FILE, type Artifact } from "../src/artifact.js";
import { landTrace, readArtifact, writeAtomic, type AtomicFs } from "../src/landing.js";
import { PRICES } from "../src/prices.js";
import { recording, RECORDINGS } from "../src/recordings.js";
import { runAndLand } from "../src/run-and-land.js";

const OPUS = PRICES["claude-opus-4-8"];
const GRAPH = loadGraph(new URL("../../12-workflow-graph/graphs/job-lifecycle.json", import.meta.url));
const LAB_12_SRC = new URL("../../12-workflow-graph/src/", import.meta.url);

const freshRoot = (): string => mkdtempSync(join(tmpdir(), "lab14-artifacts-"));

/** A recording's absolute path. RECORDINGS are relative to lab 12's src folder. */
const recordingPath = (name: string): string => {
  const path = RECORDINGS.find((p) => p.endsWith(`/${name}`));
  if (path === undefined) throw new Error(`no recording named ${name}`);
  return fileURLToPath(new URL(path, LAB_12_SRC));
};

function landed(root: string, run: string): Artifact {
  const read = readArtifact(root, run);
  if (!read.ok) throw new Error(`no artifact for ${run}: ${read.reason}`);
  return read.artifact;
}

describe("buildArtifact: the artifact is computed from the trace", () => {
  it("a landed run is done, and its output is the last completed reply", () => {
    const built = buildArtifact("audit-atlas", recording("audit-atlas.jsonl"), OPUS, "trace.jsonl");
    if (!built.ok) throw new Error(built.reason);
    expect(built.artifact.status).toBe("done");
    expect(built.artifact.outcome).toBe("landed");
    expect(built.artifact.output).toEqual({
      text: "Audit complete. The tool reported: graph=atlas nodes=1284 orphans=3 stale_edges=2",
      partial: false,
    });
    expect(built.artifact.totals).toEqual({ calls: 2, tokens: 217, microUsd: 2765 });
    expect(built.artifact.agrees).toBe(true);
    expect(built.artifact.trace).toBe("trace.jsonl");
    expect(built.artifact.costReport).toBe(COST_FILE);
  });

  it("a run the budget stopped is failed, and keeps its partial output", () => {
    const built = buildArtifact("tight-budget", recording("tight-budget.jsonl"), OPUS, "t");
    if (!built.ok) throw new Error(built.reason);
    expect(built.artifact.status).toBe("failed");
    expect(built.artifact.outcome).toBe("over_budget");
    expect(built.artifact.output).toEqual({ text: "Audit complete. The tool reported: graph=atlas", partial: true });
    expect(built.artifact.reason).not.toBeNull();
  });

  it("a record with no job_ended is failed, with no output and a reason", () => {
    const cut = recording("audit-atlas.jsonl").filter((e) => e.kind !== "job_ended");
    const built = buildArtifact("cut", cut, OPUS, "t");
    if (!built.ok) throw new Error(built.reason);
    expect(built.artifact.status).toBe("failed");
    expect(built.artifact.outcome).toBeNull();
    expect(built.artifact.output).toBeNull();
    expect(built.artifact.reason).toMatch(/no job_ended/);
    expect(built.artifact.endedAt).toBeNull();
    expect(built.artifact.agrees).toBe(false);
  });

  it("a run that ended without landing keeps no output when nothing partial was kept", () => {
    const events = recording("audit-atlas.jsonl").map((e): TraceEvent =>
      e.kind === "job_ended" ? { ...e, outcome: "gave_up" } : e,
    );
    const built = buildArtifact("gave-up", events, OPUS, "t");
    if (!built.ok) throw new Error(built.reason);
    expect(built.artifact.status).toBe("failed");
    expect(built.artifact.output).toBeNull();
  });

  it("refuses a record with no job_started: it cannot say what ran", () => {
    const events = recording("audit-atlas.jsonl").filter((e) => e.kind !== "job_started");
    expect(buildArtifact("x", events, OPUS, "t").ok).toBe(false);
  });

  it("refuses a run name that is not one plain path segment", () => {
    const events = recording("audit-atlas.jsonl");
    for (const bad of ["../escape", "Audit Atlas", "a/b", ""]) {
      expect(buildArtifact(bad, events, OPUS, "t").ok).toBe(false);
    }
  });
});

describe("landTrace: every recorded run lands one artifact", () => {
  const expected: Record<string, { status: Artifact["status"]; tokens: number; partial: number | null }> = {
    "audit-atlas.jsonl": { status: "done", tokens: 217, partial: null },
    "tight-budget.jsonl": { status: "failed", tokens: 191, partial: 46 },
    "tight-deadline.jsonl": { status: "failed", tokens: 183, partial: 24 },
    "tight-deadline-resume.jsonl": { status: "done", tokens: 335, partial: null },
    "audit-atlas-grounded.jsonl": { status: "done", tokens: 494, partial: null },
    "audit-atlas-bare.jsonl": { status: "done", tokens: 236, partial: null },
    "parked-audit.jsonl": { status: "done", tokens: 80, partial: null },
  };

  it.each(Object.entries(expected))("%s", (name, want) => {
    const root = freshRoot();
    const tracePath = recordingPath(name);
    const landing = landTrace(tracePath, root, OPUS);
    if (!landing.ok) throw new Error(landing.reason);

    const run = name.replace(/\.jsonl$/, "");
    const artifact = landed(root, run);
    expect(artifact.run).toBe(run);
    expect(artifact.status).toBe(want.status);
    expect(artifact.totals.tokens).toBe(want.tokens);
    expect(artifact.agrees).toBe(true);
    if (want.partial === null) expect(artifact.output?.partial).toBe(false);
    else expect(artifact.output?.text.length).toBe(want.partial);

    // The link to the trace resolves to the file it was landed from.
    const dir = join(root, run);
    expect(resolve(dir, artifact.trace)).toBe(resolve(tracePath));

    // The output agrees with the trace it links to: the last completed
    // reply for a done run, job_ended's partial text for a stopped one.
    const events = parseTrace(readFileSync(resolve(dir, artifact.trace), "utf8")).flatMap((l) => (l.ok ? [l.event] : []));
    const ended = events.find((e) => e.kind === "job_ended");
    const lastDone = events.findLast((e) => e.kind === "reply" && e.stop === "completed");
    const fromTrace =
      artifact.status === "done"
        ? lastDone?.kind === "reply" ? lastDone.text : undefined
        : ended?.kind === "job_ended" ? ended.partialText : undefined;
    expect(artifact.output?.text).toBe(fromTrace);

    // The link to the cost report resolves, and its totals are the artifact's.
    const report = JSON.parse(readFileSync(join(dir, artifact.costReport), "utf8")) as { totals: unknown };
    expect(report.totals).toEqual(artifact.totals);
  });

  it("the output agrees with the trace it links to", () => {
    const root = freshRoot();
    const landing = landTrace(recordingPath("tight-deadline.jsonl"), root, OPUS);
    if (!landing.ok) throw new Error(landing.reason);
    const artifact = landed(root, "tight-deadline");
    const events = parseTrace(readFileSync(resolve(join(root, "tight-deadline"), artifact.trace), "utf8"))
      .flatMap((l) => (l.ok ? [l.event] : []));
    const ended = events.find((e) => e.kind === "job_ended");
    expect(ended?.kind === "job_ended" ? ended.partialText : undefined).toBe(artifact.output?.text);
  });

  it("writes only the run's folder, with two files in it", () => {
    const root = freshRoot();
    landTrace(recordingPath("audit-atlas.jsonl"), root, OPUS);
    expect(readdirSync(root)).toEqual(["audit-atlas"]);
    expect(readdirSync(join(root, "audit-atlas")).sort()).toEqual([ARTIFACT_FILE, COST_FILE].sort());
  });

  it("landing the same trace twice writes the same bytes", () => {
    const root = freshRoot();
    landTrace(recordingPath("tight-budget.jsonl"), root, OPUS);
    const first = readFileSync(join(root, "tight-budget", ARTIFACT_FILE), "utf8");
    landTrace(recordingPath("tight-budget.jsonl"), root, OPUS);
    expect(readFileSync(join(root, "tight-budget", ARTIFACT_FILE), "utf8")).toBe(first);
  });

  it("a trace file a dead process left, with no job_ended, lands failed with no output", () => {
    const root = freshRoot();
    const dir = mkdtempSync(join(tmpdir(), "lab14-traces-"));
    const killed = join(dir, "killed.jsonl");
    const lines = readFileSync(recordingPath("tight-budget.jsonl"), "utf8").split(/\r?\n/);
    writeFileSync(killed, lines.filter((l) => !l.includes('"kind":"job_ended"')).join("\n"));
    const landing = landTrace(killed, root, OPUS);
    if (!landing.ok) throw new Error(landing.reason);
    const artifact = landed(root, "killed");
    expect(artifact.status).toBe("failed");
    expect(artifact.outcome).toBeNull();
    expect(artifact.output).toBeNull();
  });

  it("refuses a trace with a line the parse refuses, and lands nothing", () => {
    const root = freshRoot();
    const dir = mkdtempSync(join(tmpdir(), "lab14-traces-"));
    const bad = join(dir, "broken.jsonl");
    writeFileSync(bad, `${readFileSync(recordingPath("audit-atlas.jsonl"), "utf8")}{"kind":"nope"}\n`);
    const landing = landTrace(bad, root, OPUS);
    expect(landing.ok).toBe(false);
    if (!landing.ok) expect(landing.reason).toMatch(/line 9/);
    expect(existsSync(join(root, "broken"))).toBe(false);
  });
});

describe("a kill cannot leave a torn artifact", () => {
  it("artifact.json is written last: a crash after the cost report leaves no artifact", () => {
    const root = freshRoot();
    let writes = 0;
    const dying = (path: string, text: string): void => {
      writes += 1;
      if (writes === 2) throw new Error("process died");
      writeAtomic(path, text);
    };
    expect(() => landTrace(recordingPath("audit-atlas.jsonl"), root, OPUS, dying)).toThrow("process died");
    expect(existsSync(join(root, "audit-atlas", COST_FILE))).toBe(true);
    expect(readArtifact(root, "audit-atlas").ok).toBe(false);

    // The trace is still there, so landing again finishes the job.
    expect(landTrace(recordingPath("audit-atlas.jsonl"), root, OPUS).ok).toBe(true);
    expect(readArtifact(root, "audit-atlas").ok).toBe(true);
  });

  it("a write that dies halfway leaves the earlier file whole", () => {
    const dir = mkdtempSync(join(tmpdir(), "lab14-atomic-"));
    const path = join(dir, ARTIFACT_FILE);
    writeAtomic(path, '{"old":true}');
    const halfway: AtomicFs = {
      writeFileSync: (p, text) => {
        writeFileSync(p, text.slice(0, 5));
        throw new Error("process died");
      },
      renameSync: () => {
        throw new Error("never reached");
      },
    };
    expect(() => writeAtomic(path, '{"new":true,"long":"enough to tear"}', halfway)).toThrow("process died");
    expect(readFileSync(path, "utf8")).toBe('{"old":true}');
  });

  it("a torn file left beside the artifact is never read as one", () => {
    const root = freshRoot();
    landTrace(recordingPath("audit-atlas.jsonl"), root, OPUS);
    writeFileSync(join(root, "audit-atlas", `${ARTIFACT_FILE}.tmp`), '{"run":"audit-at');
    expect(readArtifact(root, "audit-atlas").ok).toBe(true);
  });

  it("readArtifact refuses bytes that are not an artifact", () => {
    const root = freshRoot();
    landTrace(recordingPath("audit-atlas.jsonl"), root, OPUS);
    writeFileSync(join(root, "audit-atlas", ARTIFACT_FILE), '{"run":"audit-atlas"}');
    expect(readArtifact(root, "audit-atlas").ok).toBe(false);
  });
});

describe("runAndLand: every way a live run ends leaves an artifact", () => {
  /** A fresh trace file path in a fresh folder, named for the run. */
  const traceFile = (run: string): string => join(mkdtempSync(join(tmpdir(), "lab14-live-")), `${run}.jsonl`);

  it("a run that lands is done", async () => {
    const root = freshRoot();
    const path = traceFile("live-done");
    const { result } = await runAndLand(path, root, OPUS, (trace) =>
      startJob(GRAPH, spec(), new FakeModelGateway([wantsTool, done]), { trace }),
    );
    expect(result.ok).toBe(true);
    const artifact = landed(root, "live-done");
    expect(artifact.status).toBe("done");
    expect(artifact.output).toEqual({ text: "Audit complete.", partial: false });
    expect(artifact.totals).toEqual({ calls: 2, tokens: 80, microUsd: 800 });
    expect(resolve(join(root, "live-done"), artifact.trace)).toBe(resolve(path));
  });

  it("a run that gives up is failed", async () => {
    const root = freshRoot();
    await runAndLand(traceFile("live-gave-up"), root, OPUS, (trace) =>
      startJob(GRAPH, spec({ maxModelCalls: 1 }), new FakeModelGateway([wantsTool]), { trace }),
    );
    const artifact = landed(root, "live-gave-up");
    expect(artifact.status).toBe("failed");
    expect(artifact.outcome).toBe("gave_up");
  });

  it("a run refused for missing evidence is failed", async () => {
    const root = freshRoot();
    await runAndLand(traceFile("live-no-evidence"), root, OPUS, (trace) =>
      startJob(GRAPH, spec({ evidenceQueries: ["MOD-004"] }), new FakeModelGateway([]), { trace }),
    );
    expect(landed(root, "live-no-evidence").outcome).toBe("no_evidence");
  });

  it("a run that crashes still lands, failed, and the crash still reaches the caller", async () => {
    const root = freshRoot();
    const dying: ApprovalPort = { decide: () => Promise.reject(new Error("process died")) };
    await expect(
      runAndLand(traceFile("live-crashed"), root, OPUS, (trace) =>
        startJob(GRAPH, spec({ approvalRequired: ["graph_health"] }), new FakeModelGateway([wantsTool]), {
          trace,
          approver: dying,
        }),
      ),
    ).rejects.toThrow("process died");
    const artifact = landed(root, "live-crashed");
    expect(artifact.status).toBe("failed");
    expect(artifact.outcome).toBeNull();
    expect(artifact.output).toBeNull();
  });

  it("refuses a run name the artifact would refuse, before the run starts", async () => {
    const root = freshRoot();
    const path = traceFile("Live Run");
    const gateway = new FakeModelGateway([wantsTool, done]);
    await expect(
      runAndLand(path, root, OPUS, (trace) => startJob(GRAPH, spec(), gateway, { trace })),
    ).rejects.toThrow(/not one lowercase path segment/);
    expect(gateway.calls).toHaveLength(0);
    expect(existsSync(path)).toBe(false);
  });

  it("a parked run has not ended, so it lands nothing until it resumes and ends", async () => {
    const root = freshRoot();
    const path = traceFile("live-parked");
    const held = spec({ approvalRequired: ["graph_health"] });
    const first = await runAndLand(path, root, OPUS, (trace) =>
      startJob(GRAPH, held, new FakeModelGateway([wantsTool]), { trace, park: true }),
    );
    if (first.result.ok || first.result.kind !== "parked") throw new Error("expected a park");
    expect(first.landing).toBeNull();
    expect(readArtifact(root, "live-parked").ok).toBe(false);

    const { node, step, state } = first.result;
    const answer = answerParked({ job: "live-parked", node, step, state }, "approved");
    if (!answer.ok) throw new Error(answer.reason);
    await runAndLand(path, root, OPUS, (trace) =>
      resumeJob(GRAPH, answer.checkpoint, held, new FakeModelGateway([done]), { trace, park: true }),
    );
    const artifact = landed(root, "live-parked");
    expect(artifact.status).toBe("done");
    expect(artifact.totals.calls).toBe(2);
  });

  it("the trace file it writes is the record the artifact links to", async () => {
    const root = freshRoot();
    const path = traceFile("live-linked");
    await runAndLand(path, root, OPUS, (trace) =>
      startJob(GRAPH, spec(), new FakeModelGateway([wantsTool, done]), { trace }),
    );
    const lines = parseTrace(readFileSync(path, "utf8"));
    expect(lines.every((l) => l.ok)).toBe(true);
    expect(lines.length).toBe(8);
    expect(landed(root, "live-linked").run).toBe(basename(path, ".jsonl"));
  });
});
