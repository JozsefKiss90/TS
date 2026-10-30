---
term: grader
aliases:
  - graders
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

# grader

A function that reads a landed [[artifact]], its [[trace]] and the [[golden-task|golden task]], and returns pass or fail with a reason.

A grader never reads the loop. Every import in `graders.ts` is `import type`, and a test fails if one is not. A grader that called the loop's code could share the loop's bugs. Hermes OS names this rule "grader ≠ graded" (ADR-0009, accepted).

Grader names live in the task file, and functions live in code. Lab 12's guards have the same shape: the graph names the rule, and `guards.ts` implements it. A guard decides a move inside the loop. A grader judges a run after it ends.

Four of the five graders check the outcome. `asks_before_held_tool` checks the path, because for a held tool the order of events is the requirement.

`within_ceiling` recounts the tokens from the trace rather than trust the artifact's totals.

**In [[lesson-0025-golden-tasks|lesson 0025]]:** five graders. Each one fails under at least one [[planted-defect|planted defect]] or test.

**Why it matters for Hermes:** S9 (score the run). Hermes OS's verification coordinator runs checks and records verdicts, and never fixes what it grades (control plane, component 10).

**Related:** [[golden-task]] · [[scorecard]] · [[planted-defect]] · [[artifact]] · [[guard]]
