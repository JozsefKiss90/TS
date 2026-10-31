# ADR 0003 — Freeze benchmark v1; the real loop's scorecard is its baseline

- **Status:** accepted, 2026-10-31 (user decision, lesson 0027 session)
- **Scope:** this course workspace's Spec-to-Evidence Loop (lab 16). It is a course decision, not a
  Hermes OS ADR. Hermes OS's own record (ADR-0001..0021 in the `hermes-os` repo) is unaffected.
- **Answers:** `ROADMAP.md` Phase 4, row 0027: the benchmark that Phase 5 and the Phase 6 gate must
  answer to is frozen and named. It is also the accepted-ADR half of the promotion rule that
  `promote.ts` enforces.

## Context

Lessons 0025 and 0026 built golden tasks, graders, a seeded fake and repeated trials. Nothing yet
stopped a change from lowering a score, or stopped the task file from changing under a score.

The Hermes OS README, Guarantees, says: "Promotion requires ≥10 consecutive clean runs plus a signed
ADR." No Hermes PDR or ADR states the number, so the rule is graded *illustrative only* when applied
here. This ADR applies it to one course choice: which scorecard becomes the baseline.

## The benchmark

**Name:** `benchmark-v1`.

**Hash:** `sha256:22a1ae48ac33a776a205f705783587144f0284a5eccbb3c6c4b4046020f218a6`

The hash covers `hermes-sdk-lab/16-benchmark/tasks/benchmark-v1.json` and the three recordings it
names, with CRLF read as LF. Any change to a weight, a spec, a grader list or a recording gives a new
hash, and the gate refuses it before any trial runs.

| Task | Recordings | Graders |
|---|---|---|
| `audit` | lab 07 `audit-atlas.jsonl` weight 9, lab 12 `parked-audit.jsonl` weight 1 | `ends_as_expected`, `reports_tool_output`, `within_ceiling` |
| `held-audit` | lab 07 `audit-atlas.jsonl`; operator approves | adds `asks_before_held_tool` |
| `capped-audit` | lab 07 `audit-atlas.jsonl`; expects `failed (gave_up)` | `ends_as_expected`, `within_ceiling` |
| `grounded-audit` | lab 11 `audit-atlas-grounded.jsonl`; carries a pack | adds `uses_the_pack` |

Trial counts: n = 20, k = 4. Trial *i* uses seed *i*.

## Evidence

Measured 2026-10-31 with zod 4.4.3, vitest 3.2.7, tsx 4.23.1, Node 22.14.0, Windows 11. Every number
measures the harness on a seeded fake. No model ran.

| Measurement | Source | Bears on |
|---|---|---|
| Real loop: audit 19 of 20 (seed 4 fails `reports_tool_output`), the other three 20 of 20. 80 trials in under 1 s. | `pnpm gate` | The baseline's content. |
| Each planted defect is refused on its own task only: `ignores-approval-list` 20 regressions on held-audit, `ignores-call-cap` 20 on capped-audit, `drops-the-pack` 60 on grounded-audit. | `pnpm gate --defect <name>`, `gate.test.ts` | The gate can fail. |
| A change that fixes seed 4 and breaks seed 2 keeps the count at 19 of 20 and is refused. | `gate.test.ts` "refuses a swap" | Why the baseline keeps seeds, not counts. |
| `drops-the-pack-after-200` passes one gate run and a second, and is refused on run 3 with 60 regressions. | `pnpm gate --promote`, `gate.test.ts` | Why a promotion needs consecutive runs, even on a fake. |
| The real loop passes ten consecutive runs with identical scorecard bytes: about 12 s in one process, about 20 s through `pnpm gate` with `tsx` start-up. | `promote.ts` | The harness repeats itself. |
| A promotion with this ADR at status *proposed* is refused before any run. | `pnpm gate --promote` | The signature is a separate condition. |
| Across 4,000 audit trials (lesson 0026), pass^10 is 0.362. | `passHatK(4000, 3614, 10)` | Ten clean runs on a live model would pass a 90% task about one time in three. |

## Decision

**Freeze `benchmark-v1` at the hash above.** Its baseline is the real loop's scorecard at n = 20,
k = 4, written by `pnpm gate --promote --adr docs/adr/0003-freeze-benchmark-v1-as-the-baseline.md`
and committed as `hermes-sdk-lab/16-benchmark/baselines/benchmark-v1.json`.

**Phase 5 answers to it.** An Agent SDK harness enters Phase 5's adopt / wrap / skip argument as a
`NamedLoop`, and it must pass `pnpm gate` against this baseline.

**Phase 6 does not open on it.** A seeded fake's ceiling is whatever its recordings were written to
do. The Phase 6 entry criterion needs a live run of these four tasks, which needs a budget.

## Consequences

- The baseline moves only through `promote`: ten consecutive clean runs and an accepted ADR that
  names the benchmark's hash.
- A change to the task file or a recording is a new benchmark, `benchmark-v2`, with its own task
  file, baseline file and ADR. `pnpm gate` names v1 only; a v2 needs its name added there.
- A fix shows as `fixed:` lines on a passing gate. The baseline stays until a promotion.
- On a fake, ten consecutive runs prove that no state leaks between runs. They prove nothing about a
  model.

## Revisit when

- A budget exists for live runs. Then the gate needs a tolerance, because a live model gives no
  seed-by-seed pairing.
- Phase 5 adds a task the four do not cover.
