# Exercise 16 — golden tasks

Lesson: [0025 — Golden Tasks](../../lessons/0025-golden-tasks.html)

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
| `src/runner.ts` | `runGolden`: run, land, read back, grade, write `scorecard.json`; strict `ScorecardSchema` |
| `src/main.ts` | `pnpm bench`, `--defect <name>`, `--all` |
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

**Found by the "no operator" survivor:** held-audit first replayed the parked audit, whose answer is
"Audit complete." With no operator, the hold is denied by default, the tool result is `failed`
(which `asks_before_held_tool` skips), and the model still finishes. Every grade passed. Held-audit
now replays `audit-atlas.jsonl`, whose answer quotes the tool, and grades `reports_tool_output`.

## Break it

1. Remove `reports_tool_output` from held-audit in `tasks/golden.json`. Run the tests and name the one
   that fails.
2. Add a fourth defect that drops the operator. Predict its scorecard before you run it.

## Not done here

- One trial per task. Repeated trials with a seeded fake and pass^k: lesson 0026.
- No committed baseline and no gate: lesson 0027.
- Four tasks are a check of the setup, not a benchmark of anything.
