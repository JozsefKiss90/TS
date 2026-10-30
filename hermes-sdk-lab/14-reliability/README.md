# Exercise 14 — what the run cost

Lesson: [0022 — What the Run Cost](../../lessons/0022-what-the-run-cost.html)

Scenario step **S7 (the durable record)**, opening Phase 4. Every trace line records a time and
every reply records its tokens. This exercise reads one trace file and returns a span per model
call and per tool run, with time, tokens and dollars. It sums the spans and checks the sums
against `job_ended`'s totals. It places the 80% budget alert at the call that crossed it.

No telemetry package, no model, no mock, no network. Lesson 0023 emits the same spans through
OpenTelemetry JS in lab 15 and tests them against these, so this lab stays library-free.

Nothing is copied. The trace files are read through lab 12's `readRecording`, which parses each
line with lab 07's `parseTrace`.

## What lives here

| File | What it is |
|---|---|
| `src/cost-report.ts` | `costReport(events, price)`: the spans, the totals, the agreement check, the alert placement. Pure |
| `src/prices.ts` | the pinned price table in integer micro-dollars per token, and where it came from |
| `src/print-report.ts` | turns a report into terminal lines; the only file that decides how numbers look |
| `src/recordings.ts` | lab 12's six recordings plus lab 12's parked audit: the seven recorded runs |
| `src/main.ts` | `pnpm job` (all seven) and `pnpm job --cost-report <file> [--model <id>]` |
| `tests/cost-report.test.ts` | 27 tests: 26 written before the code, and one added after review for two holds on one tool |

## Commands

```bash
pnpm install                                   # once, from hermes-sdk-lab/
pnpm --filter 14-reliability job               # all seven recorded runs
pnpm --filter 14-reliability job --cost-report ../07-tool-loop/traces/tight-budget.jsonl
pnpm --filter 14-reliability job --cost-report ../07-tool-loop/traces/tight-budget.jsonl --model claude-opus-5-5
pnpm --filter 14-reliability test
```

`--cost-report` exits 0 when the report agrees with `job_ended`, 1 when it does not or when a line
fails the parse, and 2 on a usage error or an unpriced model.

## Measured, 2026-10-30

Versions: `zod` 4.4.3, `vitest` 3.2.7, `tsx` 4.23.1, Node 22.14.0. Prices: the `claude-api` skill's model table,
cached 2026-10-06. claude-opus-4-8 is $5 / $25 per million input / output tokens, claude-opus-5-5
is $4 / $20.

```
audit-atlas.jsonl
Audit the atlas graph  (priced as claude-opus-4-8, prices as of 2026-10-06)
  call 1                1654 ms    65 tokens (23 in + 42 out)  $0.001165
  tool  graph_health       1 ms  auto
  call 2                1013 ms   152 tokens (110 in + 42 out)  $0.001600
  total: 2 calls, 217 tokens, $0.002765 this run, 2671 ms wall
  job_ended: 2 calls, 217 tokens, landed  ->  agrees
  80% alert: not reached (1600 of 2000)

tight-budget.jsonl
Audit the atlas graph under a tight budget  (priced as claude-opus-4-8, prices as of 2026-10-06)
  call 1                1661 ms    65 tokens (23 in + 42 out)  $0.001165
  tool  graph_health      19 ms  auto
  call 2                 777 ms   126 tokens (cut off: remainder of job_ended, estimated)  $0.003150 at most
  total: 2 calls, 191 tokens, $0.004315 this run, 2460 ms wall
  job_ended: 2 calls, 191 tokens, over_budget  ->  agrees
  80% alert: at call 2, 191 tokens >= 152, placed on an estimate  (job_ended noted it, without the call)

audit-atlas-grounded.jsonl
Audit the atlas graph  (priced as claude-opus-4-8, prices as of 2026-10-06)
  call 1                1688 ms   204 tokens (162 in + 42 out)  $0.001860
        pack MOD-004, MOD-006: ~128 of the input (estimated from 509 chars)
  tool  graph_health       1 ms  auto
  call 2                1019 ms   290 tokens (248 in + 42 out)  $0.002290
        pack MOD-004, MOD-006: ~128 of the input (estimated from 509 chars)
  total: 2 calls, 494 tokens, $0.004150 this run, 2711 ms wall
  job_ended: 2 calls, 494 tokens, landed  ->  agrees
  80% alert: not reached (1600 of 2000)

parked-audit.jsonl
Audit the atlas graph  (priced as claude-opus-4-8, prices as of 2026-10-06)
  call 1                   1 ms    30 tokens (20 in + 10 out)  $0.000350
  tool  graph_health    6803 ms  hold, 6802 ms of it waiting for a verdict
  call 2                   1 ms    50 tokens (40 in + 10 out)  $0.000450
  total: 2 calls, 80 tokens, $0.000800 this run, 6809 ms wall
  job_ended: 2 calls, 80 tokens, landed  ->  agrees
  80% alert: not reached (1600 of 2000)
```

All seven agree. The other three: tight-deadline 65 + 118 remainder = 183 ($0.004115 at most);
tight-deadline-resume 183 carried + 152 = 335 ($0.001600 this run); bare 75 + 161 = 236
($0.002860). The parked audit's times are this machine's: lesson 0019's parts g to j rewrite that
file on every run.

With `--model claude-opus-5-5`, the tight budget costs $0.003452 at most. The tokens do not
change. Only the price row does.

**Mutations of `cost-report.ts`, each restored and checked with `cmp`:**

| Mutation | Tests failing |
|---|---|
| the zero floor on the remainder removed | 1 (the cut-off call that would be booked below zero) |
| the remainder never booked to the cut-off call | 5 |
| the alert skips estimated calls | 2 (the tight budget's placement, and its alert-iff-note case) |
| the tool span starts at the approval, not the gate | 1 |
| every held gate takes the last verdict seen | 1 (two holds on one tool, in one reply) |

On the two runs with a cut-off call, the token totals match `job_ended` by construction, because
the remainder is defined as the gap. There the only token check left is that the remainder is not
below zero. The tight budget's alert is placed on that estimated remainder, and the report says
so.

## Break it

1. Copy `../07-tool-loop/traces/audit-atlas.jsonl`, add 1 to one `outputTokens`, and run
   `--cost-report` on the copy. Expected: total 218, `job_ended` 217, `DISAGREES`, exit 1.
2. In the copy, delete the `job_ended` line. Expected: "job_ended: missing", exit 1.
3. Set `CHARS_PER_TOKEN` to 3, the supervisor's output estimate. Expected: both pack tests fail,
   because 170 tokens is 41 away from the measured 129.

## Not done here, on purpose

- **No telemetry library.** Lesson 0023, lab 15.
- **No landed artifact linked to its cost.** Lesson 0024 (S8).
- **The trace is not changed.** It still records no model id and no pack tokens. Adding either
  would change lab 07's schema, which every earlier lab reads. The report names both gaps instead.
- **The recorded traces are not committed.** `hermes-sdk-lab/.gitignore` excludes `traces/`. Lab 12's
  and lab 13's tests already read these local files, and so do lab 14's. A fresh clone has to
  re-record them before the tests can pass.
