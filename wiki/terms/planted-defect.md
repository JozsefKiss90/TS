---
term: planted defect
aliases:
  - planted defects
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

# planted defect

A copy of the loop with one bug added on purpose, to prove that some grader fails on it.

A grader that no defect can fail is untested. Lab 16 ships three defects in `defects.ts`, each the real loop with one change. Each changes what the loop is given, not the loop's code, and each fails exactly one task. The idea is the same as the mutation checks every lab since 0017 ran by hand, moved into the benchmark.

**In [[lesson-0025-golden-tasks|lesson 0025]]:** `ignores-approval-list` fails one grade, `ignores-call-cap` one, `drops-the-pack` three. A loop with no operator wired first passed every grade, so the held task gained `reports_tool_output`.

**Why it matters for Hermes:** S9 (score the run). A regression gate (lesson 0027, planned) is only as strong as the graders behind it.

**Related:** [[golden-task]] · [[grader]] · [[scorecard]]
