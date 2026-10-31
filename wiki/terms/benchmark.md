---
term: benchmark
aliases:
  - benchmark-v1
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

# benchmark

A fixed set of golden tasks, their recordings, and the trial counts n and k, named and hashed.

`benchmarkHash` in lab 16 reads the task file and every recording it names, with CRLF read as LF, and returns one sha256. A changed weight, spec, grader list or recording gives a new hash. A changed benchmark is a new benchmark, so its scores do not compare with the old ones.

**In [[lesson-0027-the-regression-gate|lesson 0027]]:** `benchmark-v1` is four [[golden-task|golden tasks]] at n = 20, k = 4, hash `sha256:22a1ae48…`. ADR 0003 freezes it.

**Why it matters for Hermes:** S9 (score the run). Phase 5's adopt / wrap / skip argument answers to `benchmark-v1`. The Phase 6 gate needs a live run of the same tasks.

**Related:** [[baseline]] · [[golden-task]] · [[trial]] · [[regression-gate]]
