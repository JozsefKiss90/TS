# Exercise 16 — golden tasks, many trials, a regression gate

Lessons: [0025 — Golden Tasks](../../lessons/0025-golden-tasks.html) ·
[0026 — Many Runs, One Verdict](../../lessons/0026-many-runs-one-verdict.html) ·
[0027 — The Regression Gate](../../lessons/0027-the-regression-gate.html)

Scenario step **S9 (score the run)**. Four golden tasks run offline through a loop. Each run lands
through lab 14's `runAndLand`, five named graders read the artifact and the trace, and one scorecard
records every grade. Three planted defects prove that the graders can fail.

No model, no mock, no network. The fake gateway replays the reply lines of a recorded trace. Every
number here measures the benchmark code and the loop, never a model.

The graders import types only, and a test refuses any value import, `import()` or `require()`. The
runner calls lab 14's exported `runAndLand`, `readArtifact` and `writeAtomic`. Only `src/loop.ts`
names lab 12, and the runner calls the loop through a function type, so the graders cannot tell the
real loop from a defect. Lab 12 is unchanged.

## What lives here

| File | What it is |
|---|---|
| `tasks/golden.json` | four golden tasks: spec, fixture (a recorded trace), operator, pack, expected ending, grader names |
| `src/golden-task.ts` | `admitGoldenTasks`: strict Zod; the spec nests lab 07's `TaskSpecSchema`; five cross-field rules |
| `src/fixture.ts` | `fixtureFromTrace`: reply lines → `GatewayResult[]` for the fake |
| `src/graders.ts` | the five graders, `(seen) => { pass, why }`, type imports only |
| `src/loop.ts` | `Loop`, `NamedLoop`, and `REAL_LOOP` (lab 12's `startJob` on lab 12's graph) |
| `src/defects.ts` | three planted defects, each the real loop given one wrong input. The defect inside the loop's code is the hand edit below |
| `src/runner.ts` | `runGolden`: run, land, read back, grade, write `scorecard.json`; strict `ScorecardSchema`. 0026: `variantsFor` and `runOnce`, shared with the trials |
| `src/main.ts` | `pnpm bench`, `--defect <name>`, `--all` |
| `tasks/trials.json` | 0026: `audit` with two weighted recordings (9 : 1), `grounded-audit` with one |
| `src/seeded-gateway.ts` | 0026: `pickVariant` (seed → weighted index, mulberry32) and `SeededFakeGateway`, a `ModelGateway` that replays the recording its seed chose |
| `src/trials.ts` | 0026: `passHatK` (τ-bench), `settlePoint`, `trueRate`, `rerunTrial`, `runSeries`, `runTrials` → strict, clock-free `trials.json` |
| `src/trials-main.ts` | 0026: `pnpm trials`, `--n`, `--k`, `--rerun <task> --seed <s>`, `--settle` |
| `tests/trials.test.ts` | 0026: 21 tests. 18 written before the code; 1 added after a mutation check; 2 for `trueRate`, added after review and seen red |
| `tasks/benchmark-v1.json` | 0027: the frozen benchmark. Lesson 0025's four tasks, audit on 0026's 9 : 1 recordings |
| `baselines/benchmark-v1.json` | 0027: the committed baseline. Hash, n, k, the ADR, every failed trial by seed and grader. Written only by `--promote` |
| `src/benchmark.ts` | 0027: `benchmarkHash` (task file + recordings, CRLF read as LF), strict `BaselineSchema`, `baselineFrom` |
| `src/gate.ts` | 0027: `gate(baseline, { hash, card })`, pure. Refuses `benchmark_changed`, `counts_changed`, `tasks_changed`, `regression` |
| `src/promote.ts` | 0027: `promote`: an accepted ADR naming the hash, then ten consecutive clean runs with the same bytes |
| `src/gate-defects.ts` | 0027: `dropsThePackAfter(limit)`, a defect that one gate run cannot see |
| `src/gate-main.ts` | 0027: `pnpm gate`, `--defect <name>`, `--promote --adr <path>` |
| `tests/gate.test.ts` | 0027: 19 tests. 18 written before the code and seen red (no `benchmark.ts`); 1 added after review |
| `tests/golden.test.ts` | 27 tests. 23 written before the code; 4 added after mutation checks, the per-task verdict and review |

## Commands

```bash
pnpm install                                       # once, from hermes-sdk-lab/
pnpm --filter 16-benchmark bench                   # the real loop
pnpm --filter 16-benchmark bench --defect drops-the-pack
pnpm --filter 16-benchmark bench --all             # real, then every defect
pnpm --filter 16-benchmark test
```

Each loop writes `runs/<loop>/` (traces, artifacts, `scorecard.json`), ignored by git. `pnpm bench`
exits 0 only when every grade passes, so `--all` always exits 1.

## Measured, 2026-10-30

`zod` 4.4.3, `vitest` 3.2.7, `tsx` 4.23.1, `@types/node` 22.20.1, Node 22.14.0, Windows 11.

```
=== real: 4 of 4 tasks pass, 13 of 13 grades ===
=== ignores-approval-list: 3 of 4 tasks pass, 12 of 13 grades ===
FAIL held-audit      done
    FAIL  asks_before_held_tool  graph_health ran with no approval before it
=== ignores-call-cap: 3 of 4 tasks pass, 12 of 13 grades ===
FAIL capped-audit    done
    FAIL  ends_as_expected       wanted failed (gave_up), got done (landed)
=== drops-the-pack: 3 of 4 tasks pass, 10 of 13 grades ===
FAIL grounded-audit  failed
    FAIL  ends_as_expected       wanted done (landed), got failed (no_evidence)
    FAIL  uses_the_pack          no evidence_used line
    FAIL  reports_tool_output    no tool result succeeded, so there is nothing to report
```

- Token totals on the real loop equal the recordings: audit 217, held-audit 217, capped-audit 65,
  grounded-audit 494. They are replayed, not computed from what the loop sent.
- Under `drops-the-pack`, `within_ceiling` passes at "0 of 2000 tokens". The task fails anyway.
- `runs/real/scorecard.json` is 2,336 bytes and holds no clock. A second run writes the same bytes.
- `within_ceiling` recounts tokens from the reply lines and checks them against `job_ended` and the
  artifact's totals, so it does not trust lab 14's cost report.
- **Hand edit of real code:** lab 07 `approval.ts`, `gateToolCall` returning `"auto"` for a held tool.
  `pnpm bench`: held-audit fails `asks_before_held_tool` alone, 12 of 13. Restored: 13 of 13.

## Many trials, measured 2026-10-31 (lesson 0026)

A task's `fixture` may be a list of `{ recording, weight }`. Trial *i* uses seed *i*, and the seed
picks one recording. `audit` replays `audit-atlas.jsonl` at weight 9 and lab 12's
`parked-audit.jsonl` at weight 1. The parked recording answers "Audit complete." and drops the
tool's numbers, so it fails `reports_tool_output` and nothing else. The failure rate is 10%
because the file says so, not because a model chose it.

```bash
pnpm --filter 16-benchmark trials                      # n = 20, k = 4
pnpm --filter 16-benchmark trials --rerun audit --seed 4
pnpm --filter 16-benchmark trials --settle             # 4,000 trials, about 50 s
```

```
=== audit: 19 of 20 trials pass; pass rate 95.0%; pass^4 0.800 ===
FAIL audit seed 4  parked-audit.jsonl  failed: reports_tool_output
=== grounded-audit: 20 of 20 trials pass; pass rate 100.0%; pass^4 1.000 ===
```

- `--n 4 --k 4`: audit 3 of 4, pass^4 0.000. One failure in four trials zeroes pass^k at n = k.
- `--rerun audit --seed 4` fails the same grade on the same recording. The test compares the two
  traces with the clock removed, line for line.
- `runs/trials/trials.json` at n = 20 is 7,065 bytes, with no clock. A second run writes the same bytes.
- `--settle`, ten series of 400 seeds each. The target is the rate the weights imply (`trueRate`), so a weight change moves it:

| | Lowest | Highest |
|---|---|---|
| pass rate after 10 trials | 70.0% | 100.0% |
| pass rate after 100 trials | 87.0% | 95.0% |
| trials until the rate stays within 10 points of 90% | 1 | 35 |
| trials until the rate stays within 5 points of 90% | 7 | 106 |

All 4,000 trials: 3,614 passed (90.3%). pass^1 0.903, pass^2 0.816, pass^4 0.666, pass^8 0.444,
against 0.9^k = 0.900, 0.810, 0.656, 0.430. "Stays within" means up to trial 400 of that series.

## Mutation checks

Each made in a copy, run, and restored.

| Mutation | Tests that fail |
|---|---|
| `ends_as_expected` always passes | 3 |
| `asks_before_held_tool` never fails | 2 |
| `reports_tool_output` never fails | 1 |
| `uses_the_pack` ignores order | 0 at first → 1 after a test was added |
| `within_ceiling` skips its recount check (after review) | 1 |
| runner keeps the old trace file | 1 |
| runner wires no operator | 0 at first → 3 after the fix below |
| a task passes on any grade | 4 |
| a crash aborts the benchmark | 1 |
| the operator rule in the task file is off | 1 |
| 0026: `passHatK` returns the pass rate | 2 |
| 0026: the seed is ignored (always the first recording) | 2 |
| 0026: every trial of a task shares one run name | 1 |
| 0027: the hash keeps CRLF | 1 |
| 0027: the hash skips the recordings | 3 |
| 0027: the gate skips the hash check | 1 |
| 0027: the gate compares pass counts, not seeds | 1 |
| 0027: `promote` skips the same-bytes check | 1 |
| 0027: `promote` ignores the ADR's status line | 2 |
| 0026: a trial reports no failed graders | 1 |
| 0026: the runner keeps the old trace file | 1 |
| 0026: `settlePoint` never starts again | 0 at first → 1 after a test was added |
| 0026: `point < w` becomes `point <= w` | 0, expected: a draw lands exactly on a boundary almost never |

**Found by the "no operator" survivor:** held-audit first replayed the parked audit, whose answer is
"Audit complete." With no operator, the hold is denied by default, the tool result is `failed`
(which `asks_before_held_tool` skips), and the model still finishes. Every grade passed. Held-audit
now replays `audit-atlas.jsonl`, whose answer quotes the tool, and grades `reports_tool_output`.

## Break it

1. Remove `reports_tool_output` from held-audit in `tasks/golden.json`. Run the tests and name the one
   that fails.
2. Add a fourth defect that drops the operator. Predict its scorecard before you run it.

## Not done here

- `pnpm bench` runs one trial per task (seed 1). `pnpm trials` runs many, on the real loop only.
- The variation comes from two recordings chosen by weight. It is not what a live model does.
- The gate pairs trials by seed, so it has no tolerance for a live model.
- Four tasks are a check of the setup, not a benchmark of anything.

## The regression gate, measured 2026-10-31 (lesson 0027)

`benchmark-v1` is `tasks/benchmark-v1.json` plus the three recordings it names, at n = 20 and k = 4.
Its hash is `sha256:22a1ae48ac33a776a205f705783587144f0284a5eccbb3c6c4b4046020f218a6`. The baseline
was promoted under [ADR 0003](../../docs/adr/0003-freeze-benchmark-v1-as-the-baseline.md), accepted by
the user on 2026-10-31.

```bash
pnpm --filter 16-benchmark gate                                   # the real loop
pnpm --filter 16-benchmark gate --defect drops-the-pack
pnpm --filter 16-benchmark gate --defect drops-the-pack-after-200 # passes one run
pnpm --filter 16-benchmark gate --promote --adr docs/adr/0003-freeze-benchmark-v1-as-the-baseline.md --defect drops-the-pack-after-200
```

```
audit           19 of 20  pass^4 0.800
held-audit      20 of 20  pass^4 1.000
capped-audit    20 of 20  pass^4 1.000
grounded-audit  20 of 20  pass^4 1.000
PASSED real: no trial fails that passed in the baseline
```

| Candidate | Verdict |
|---|---|
| real loop | passed |
| `ignores-approval-list` | refused, 20 regressions on held-audit (`asks_before_held_tool`) |
| `ignores-call-cap` | refused, 20 regressions on capped-audit (`ends_as_expected`) |
| `drops-the-pack` | refused, 60 regressions on grounded-audit (three graders) |
| hand edit: lab 07 `gateToolCall` returns `"auto"` for a held tool | refused, the same 20 as `ignores-approval-list`. Restored: passed |
| audit weight 9 → 3 | refused before any trial: `benchmark changed` |
| `drops-the-pack-after-200`, one gate run | passed |
| `drops-the-pack-after-200`, `--promote` | refused after 2 clean runs; run 3 has 60 regressions |
| promotion with ADR 0003 at status proposed | refused after 0 runs |
| promotion of the real loop, ADR accepted | 10 clean runs, about 20 s with `tsx` start-up; wrote the 764-byte baseline |

- A swap that keeps audit at 19 of 20 (seed 4 fixed, seed 2 broken) is refused; see the test.
- A fixed failure passes and prints `fixed:`. The baseline moves only by promotion.
- The gate pairs trials by seed. A live model gives no such pairing, so a live gate needs a tolerance.
