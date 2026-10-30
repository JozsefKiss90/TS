---
term: pass^k
aliases:
  - passHatK
  - pass hat k
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

# pass^k

The chance that k trials of one task all pass. It says whether the task can be trusted k times in a row.

The τ-bench paper (Yao et al., arXiv 2406.12045, §3) estimates it from n trials, of which c passed, as C(c, k) / C(n, k), averaged across tasks. At k = 1 it equals the [[pass-rate|pass rate]]. At n = k it is 1 when every trial passed and 0 otherwise. `passHatK` in lab 16 computes it for one task.

**In [[lesson-0026-many-runs-one-verdict|lesson 0026]]:** audit passed 19 of 20, so pass^4 is 3876 / 4845 = 0.8. Over 4,000 trials, pass^8 measured 0.444 against 0.9^8 = 0.430.

**Why it matters for Hermes:** S9 (score the run). Hermes runs jobs unattended, so the cost of a task that fails one time in ten is in pass^k, not the pass rate.

**Related:** [[pass-rate]] · [[pass-at-k]] · [[trial]]
