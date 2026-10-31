---
term: baseline
aliases:
  - baseline scorecard
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

# baseline

The committed scorecard that every later change to the loop is compared with.

Lab 16's baseline is `baselines/benchmark-v1.json`. It holds the [[benchmark]]'s hash, n and k, the ADR that promoted it, and each task's pass count and failed trials, by seed and grader. It has no clock, so the same loop writes the same bytes.

**In [[lesson-0027-the-regression-gate|lesson 0027]]:** audit 19 of 20, with seed 4 failing `reports_tool_output`. The other three tasks pass 20 of 20. The file is 764 bytes.

**Why it matters for Hermes:** S9 (score the run). A [[regression-gate|regression gate]] needs a fixed record of what passed. The baseline moves only through a [[promotion]].

**Related:** [[benchmark]] · [[scorecard]] · [[regression]] · [[promotion]]
