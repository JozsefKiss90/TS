---
term: pass rate
aliases:
  - passRate
type: glossary-term
lesson: "0026"
phase: 4
category: hermes
status: introduced
introduced: 2026-10-31
tags:
  - glossary
  - hermes
---

# pass rate

The number of passed trials divided by the number of trials run. It says how often a task passes.

`trials.json` stores it per task as `passRate`, beside `passed` and the run rows.

**In [[lesson-0026-many-runs-one-verdict|lesson 0026]]:** audit at n = 20 scored 0.95. Over 4,000 trials it scored 0.903 against a true 0.9. After ten trials the ten series ranged from 70% to 100%, so a small n can read "perfect" for a task that fails one time in ten.

**Why it matters for Hermes:** S9 (score the run). The pass rate hides how often an unattended job fails in a row of runs. [[pass-hat-k|pass^k]] shows it.

**Related:** [[trial]] · [[pass-hat-k]] · [[pass-at-k]] · [[scorecard]]
