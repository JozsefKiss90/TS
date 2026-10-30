---
term: pass@k
aliases:
  - pass at k
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

# pass@k

The chance that at least one of k trials of one task passes.

τ-bench estimates it as 1 − C(n − c, k) / C(n, k). It suits a task where a person keeps the best of several tries. Lab 16 does not compute it.

**In [[lesson-0026-many-runs-one-verdict|lesson 0026]]:** at 19 of 20 and k = 4, pass@k is 1, because one failure cannot fill four draws. pass^4 is 0.8.

**Why it matters for Hermes:** S9 (score the run). Hermes runs jobs unattended, with no person to pick the best try, so its benchmark reports [[pass-hat-k|pass^k]].

**Related:** [[pass-hat-k]] · [[pass-rate]] · [[trial]]
