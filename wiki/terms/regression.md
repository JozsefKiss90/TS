---
term: regression
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

# regression

A trial failure that the baseline does not list: the same task, the same seed, and the same grader.

The seed picks the recording, so seed 4 replays the same trial on both sides. A pass count alone can hide a regression. A change that fixes seed 4 and breaks seed 2 still scores 19 of 20.

**In [[lesson-0027-the-regression-gate|lesson 0027]]:** `ignores-approval-list` has 20 regressions, all on held-audit, all `asks_before_held_tool`.

**Why it matters for Hermes:** S9 (score the run). The Hermes integration scenario says regressions gate any promotion.

**Related:** [[baseline]] · [[regression-gate]] · [[trial]] · [[grader]]
