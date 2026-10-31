/**
 * The regression gate (lesson 0027), written before the code.
 *
 * Four seams. `benchmarkHash` fingerprints the task file and every
 * recording it names. `baselineFrom` turns a trial scorecard into the
 * committed baseline. `gate` compares a candidate with the baseline and
 * refuses any trial failure the baseline did not have. `promote` replaces
 * the baseline only after ten consecutive clean runs and an accepted ADR.
 *
 * The rule the suite enforces: a score can only move down through a
 * refusal, and the baseline only moves through a promotion.
 */
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { PRICES } from "../../14-reliability/src/prices.js";
import { admitBaseline, baselineFrom, benchmarkHash, type Baseline } from "../src/benchmark.js";
import { DEFECTS } from "../src/defects.js";
import { gate } from "../src/gate.js";
import { dropsThePackAfter } from "../src/gate-defects.js";
import { loadGoldenTasks, type GoldenTask } from "../src/golden-task.js";
import { REAL_LOOP } from "../src/loop.js";
import { adrIsAccepted, promote } from "../src/promote.js";
import { runTrials, type TrialScorecard } from "../src/trials.js";

const OPUS = PRICES["claude-opus-4-8"];
const BENCHMARK = fileURLToPath(new URL("../tasks/benchmark-v1.json", import.meta.url));
const COMMITTED = fileURLToPath(new URL("../baselines/benchmark-v1.json", import.meta.url));
const freshRoot = (): string => mkdtempSync(join(tmpdir(), "lab16-gate-"));

function tasks(): GoldenTask[] {
  const loaded = loadGoldenTasks(BENCHMARK);
  if (!loaded.ok) throw new Error(loaded.reason);
  return loaded.tasks;
}

/** A scorecard by hand: task → [seed, failed graders][] for the trials that failed. */
function card(failures: Record<string, [number, string[]][]>, n = 4, k = 2): TrialScorecard {
  return {
    loop: "real",
    n,
    k,
    tasks: Object.entries(failures).map(([id, failed]) => ({
      id,
      passed: n - failed.length,
      passRate: (n - failed.length) / n,
      passHatK: 0,
      runs: Array.from({ length: n }, (_, i) => {
        const hit = failed.find(([seed]) => seed === i + 1);
        return { seed: i + 1, variant: "r.jsonl", pass: hit === undefined, failed: (hit?.[1] ?? []) as never };
      }),
    })),
  };
}

const HASH = "sha256:" + "a".repeat(64);
const base = (failures: Record<string, [number, string[]][]>): Baseline =>
  baselineFrom(card(failures), "benchmark-v1", HASH, "docs/adr/0003-x.md");

describe("benchmarkHash: the benchmark is the task file and every recording it names", () => {
  it("is stable, and ignores CRLF line endings that git may write on checkout", () => {
    const dir = freshRoot();
    writeFileSync(join(dir, "r.jsonl"), '{"a":1}\n{"b":2}\n');
    writeFileSync(join(dir, "t.json"), '{"tasks":[{"fixture":"r.jsonl"}]}\n');
    const lf = benchmarkHash(join(dir, "t.json"));
    writeFileSync(join(dir, "r.jsonl"), '{"a":1}\r\n{"b":2}\r\n');
    expect(benchmarkHash(join(dir, "t.json"))).toBe(lf);
    expect(lf).toMatch(/^sha256:[0-9a-f]{64}$/);
  });

  it("changes when a weight in the task file changes", () => {
    // Copies elsewhere, with the recordings made absolute so they still resolve.
    const lab = join(BENCHMARK, "../../../").replaceAll("\\", "/");
    const text = readFileSync(BENCHMARK, "utf8").replaceAll("../../", lab);
    const dir = freshRoot();
    writeFileSync(join(dir, "original.json"), text);
    writeFileSync(join(dir, "changed.json"), text.replace('"weight": 9', '"weight": 3'));
    expect(benchmarkHash(join(dir, "changed.json"))).not.toBe(benchmarkHash(join(dir, "original.json")));
  });

  it("changes when a recording's bytes change, even with the task file untouched", () => {
    const dir = freshRoot();
    writeFileSync(join(dir, "r.jsonl"), '{"a":1}\n');
    writeFileSync(join(dir, "t.json"), '{"tasks":[{"fixture":[{"recording":"r.jsonl","weight":1}]}]}\n');
    const before = benchmarkHash(join(dir, "t.json"));
    writeFileSync(join(dir, "r.jsonl"), '{"a":2}\n');
    expect(benchmarkHash(join(dir, "t.json"))).not.toBe(before);
  });
});

describe("baselineFrom and admitBaseline: the committed file", () => {
  it("keeps each task's failed seeds and graders, and no runs or clock", () => {
    const b = base({ audit: [[4, ["reports_tool_output"]]], "held-audit": [] });
    expect(b.tasks[0]).toEqual({ id: "audit", passed: 3, passHatK: 0, failures: [{ seed: 4, graders: ["reports_tool_output"] }] });
    expect(JSON.stringify(b)).not.toMatch(/"at"|"runs"/);
    expect(admitBaseline(JSON.parse(JSON.stringify(b))).ok).toBe(true);
  });

  it("refuses an unknown key and a baseline with no ADR", () => {
    const b = base({ audit: [] });
    expect(admitBaseline({ ...b, extra: 1 }).ok).toBe(false);
    const { adr: _gone, ...noAdr } = b;
    expect(admitBaseline(noAdr).ok).toBe(false);
  });
});

describe("gate: a trial failure the baseline did not have is a regression", () => {
  const baseline = base({ audit: [[4, ["reports_tool_output"]]], "held-audit": [] });

  it("passes the same scorecard", () => {
    expect(gate(baseline, { hash: HASH, card: card({ audit: [[4, ["reports_tool_output"]]], "held-audit": [] }) })).toEqual({ ok: true, fixed: [] });
  });

  it("refuses a new failed grader and names the task, seed and grader", () => {
    const v = gate(baseline, { hash: HASH, card: card({ audit: [[4, ["reports_tool_output"]]], "held-audit": [[2, ["asks_before_held_tool"]]] }) });
    expect(v).toEqual({ ok: false, refusals: [{ kind: "regression", task: "held-audit", seed: 2, grader: "asks_before_held_tool" }] });
  });

  it("refuses a swap: the pass count stays 3 of 4, but seed 2 fails where seed 4 did", () => {
    const v = gate(baseline, { hash: HASH, card: card({ audit: [[2, ["reports_tool_output"]]], "held-audit": [] }) });
    expect(v.ok).toBe(false);
    if (!v.ok) expect(v.refusals).toEqual([{ kind: "regression", task: "audit", seed: 2, grader: "reports_tool_output" }]);
  });

  it("passes a fix, and reports it, without moving the baseline", () => {
    const v = gate(baseline, { hash: HASH, card: card({ audit: [], "held-audit": [] }) });
    expect(v).toEqual({ ok: true, fixed: [{ task: "audit", seed: 4, grader: "reports_tool_output" }] });
  });

  it("refuses a changed benchmark before comparing any trial", () => {
    const v = gate(baseline, { hash: "sha256:" + "b".repeat(64), card: card({ audit: [], "held-audit": [[1, ["ends_as_expected"]]] }) });
    expect(v).toEqual({ ok: false, refusals: [{ kind: "benchmark_changed", baseline: HASH, candidate: "sha256:" + "b".repeat(64) }] });
  });

  it("refuses other counts and other tasks", () => {
    const counts = gate(baseline, { hash: HASH, card: card({ audit: [], "held-audit": [] }, 8, 2) });
    expect(counts.ok === false && counts.refusals[0]?.kind).toBe("counts_changed");
    const other = gate(baseline, { hash: HASH, card: card({ audit: [[4, ["reports_tool_output"]]] }) });
    expect(other.ok === false && other.refusals[0]?.kind).toBe("tasks_changed");
  });
});

describe("the committed baseline and the real benchmark", () => {
  it("names the benchmark's current hash and the ADR that promoted it", () => {
    const admitted = admitBaseline(JSON.parse(readFileSync(COMMITTED, "utf8")));
    if (!admitted.ok) throw new Error(admitted.reason);
    expect(admitted.baseline.hash).toBe(benchmarkHash(BENCHMARK));
    expect(admitted.baseline.adr).toMatch(/^docs\/adr\/0003-/);
  });

  it("passes the real loop, and refuses each planted defect on its own task", async () => {
    const admitted = admitBaseline(JSON.parse(readFileSync(COMMITTED, "utf8")));
    if (!admitted.ok) throw new Error(admitted.reason);
    const hash = benchmarkHash(BENCHMARK);
    const opts = { n: admitted.baseline.n, k: admitted.baseline.k };
    const real = await runTrials(tasks(), BENCHMARK, freshRoot(), REAL_LOOP, OPUS, opts);
    expect(gate(admitted.baseline, { hash, card: real })).toEqual({ ok: true, fixed: [] });

    const expected = { "ignores-approval-list": "held-audit", "ignores-call-cap": "capped-audit", "drops-the-pack": "grounded-audit" };
    for (const [name, task] of Object.entries(expected)) {
      const c = await runTrials(tasks(), BENCHMARK, freshRoot(), DEFECTS[name as keyof typeof DEFECTS], OPUS, opts);
      const v = gate(admitted.baseline, { hash, card: c });
      expect(v.ok, name).toBe(false);
      if (!v.ok) expect(new Set(v.refusals.map((r) => (r.kind === "regression" ? r.task : r.kind))), name).toEqual(new Set([task]));
    }
  }, 60_000);
});

describe("promote: ten consecutive clean runs and an accepted ADR", () => {
  const adr = (status: string, hash: string): string => {
    const dir = freshRoot();
    const path = join(dir, "0003-test.md");
    writeFileSync(path, `# ADR\n\n- **Status:** ${status}\n\nBenchmark hash ${hash}\n`);
    return path;
  };

  it("reads the ADR's status line and wants the benchmark's hash in it", () => {
    const hash = benchmarkHash(BENCHMARK);
    expect(adrIsAccepted(adr("accepted, 2026-10-31", hash), hash)).toEqual({ ok: true });
    expect(adrIsAccepted(adr("proposed", hash), hash).ok).toBe(false);
    expect(adrIsAccepted(adr("accepted", "sha256:" + "c".repeat(64)), hash).ok).toBe(false);
  });

  it("refuses an ADR path the baseline could not record, before any run", async () => {
    const hash = benchmarkHash(BENCHMARK);
    const result = await promote({
      taskFile: BENCHMARK, root: freshRoot(), loop: REAL_LOOP, price: OPUS, n: 2, k: 1,
      adr: adr("accepted", hash), adrRef: "./docs/adr/0003-test.md", benchmark: "benchmark-v1", current: null, runs: 10,
    });
    expect(result).toMatchObject({ ok: false, cleanRuns: 0, reason: expect.stringMatching(/docs\/adr\/NNNN/) });
  });

  it("refuses an unsigned ADR before any run", async () => {
    const hash = benchmarkHash(BENCHMARK);
    const result = await promote({
      taskFile: BENCHMARK, root: freshRoot(), loop: REAL_LOOP, price: OPUS, n: 2, k: 1,
      adr: adr("proposed", hash), adrRef: "docs/adr/0003-test.md", benchmark: "benchmark-v1", current: null, runs: 10,
    });
    expect(result).toMatchObject({ ok: false, reason: expect.stringMatching(/not accepted/), cleanRuns: 0 });
  });

  it("writes a baseline after ten clean runs that write the same bytes", async () => {
    const hash = benchmarkHash(BENCHMARK);
    const result = await promote({
      taskFile: BENCHMARK, root: freshRoot(), loop: REAL_LOOP, price: OPUS, n: 2, k: 1,
      adr: adr("accepted", hash), adrRef: "docs/adr/0003-test.md", benchmark: "benchmark-v1", current: null, runs: 10,
    });
    if (!result.ok) throw new Error(result.reason);
    expect(result.cleanRuns).toBe(10);
    expect(result.baseline).toMatchObject({ benchmark: "benchmark-v1", hash, n: 2, k: 1, adr: "docs/adr/0003-test.md" });
  }, 60_000);

  it("refuses a loop whose hidden state breaks a later run, and counts the clean runs before it", async () => {
    const hash = benchmarkHash(BENCHMARK);
    // n = 2: each run is 8 jobs, so a pack lost after job 20 first shows in run 3.
    const result = await promote({
      taskFile: BENCHMARK, root: freshRoot(), loop: dropsThePackAfter(20), price: OPUS, n: 2, k: 1,
      adr: adr("accepted", hash), adrRef: "docs/adr/0003-test.md", benchmark: "benchmark-v1", current: null, runs: 10,
    });
    expect(result).toMatchObject({ ok: false, cleanRuns: 2 });
  }, 60_000);

  it("refuses a run with a regression against the current baseline", async () => {
    const hash = benchmarkHash(BENCHMARK);
    const current = baselineFrom(card({ audit: [], "held-audit": [], "capped-audit": [], "grounded-audit": [] }, 2, 1), "benchmark-v1", hash, "docs/adr/0003-x.md");
    const result = await promote({
      taskFile: BENCHMARK, root: freshRoot(), loop: DEFECTS["ignores-call-cap"], price: OPUS, n: 2, k: 1,
      adr: adr("accepted", hash), adrRef: "docs/adr/0003-test.md", benchmark: "benchmark-v1", current, runs: 10,
    });
    expect(result).toMatchObject({ ok: false, cleanRuns: 0, reason: expect.stringMatching(/capped-audit/) });
  }, 60_000);
});
