---
term: scorecard
aliases:
  - scorecard.json
type: glossary-term
lesson: "0025"
phase: 4
category: hermes
status: introduced
introduced: 2026-10-30
tags:
  - glossary
  - hermes
---

# scorecard

The file one benchmark run writes: every task, every grade with its reason, and the counts that passed.

`runGolden` writes `scorecard.json` through lab 14's `writeAtomic`. A strict Zod schema admits it. It holds no clock, so the same loop on the same tasks writes the same bytes, and two scorecards compare with a diff.

A task passes only when every grade on it passes. Under the `drops-the-pack` defect, `within_ceiling` passes at 0 tokens on a task that ran nothing, and the task still fails.

**In [[lesson-0025-golden-tasks|lesson 0025]]:** the real loop scores 4 of 4 tasks and 13 of 13 grades. Each planted defect scores 3 of 4 tasks.

**Why it matters for Hermes:** S9 (score the run). Lesson 0027 plans to commit a baseline scorecard and refuse any change that scores below it.

**Related:** [[golden-task]] · [[grader]] · [[planted-defect]] · [[artifact]] · [[trace]]
