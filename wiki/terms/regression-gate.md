---
term: regression gate
aliases:
  - gate (benchmark)
type: glossary-term
lesson: "0027"
phase: 4
category: hermes
status: introduced
introduced: 2026-10-31
tags:
  - glossary
  - hermes
---

# regression gate

A check that refuses a change to the loop when its scorecard has a regression against the baseline.

Lab 16's `gate(baseline, candidate)` is pure, like lab 07's `gateToolCall` behind the [[approval-gate|approval gate]]. It reads and answers, and runs nothing. It refuses a changed benchmark hash, changed trial counts, a changed task list, or any [[regression]]. A fixed failure passes and is reported, and the [[baseline]] stays.

**In [[lesson-0027-the-regression-gate|lesson 0027]]:** `pnpm gate` passes the real loop and refuses each planted defect on its own task. It also refuses a hand edit of `gateToolCall` that skips the operator.

**Why it matters for Hermes:** S9 (score the run). It is the check that turns a score into a refusal.

**Related:** [[regression]] · [[baseline]] · [[promotion]] · [[approval-gate]]
