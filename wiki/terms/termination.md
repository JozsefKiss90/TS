---
term: termination
aliases:
  - bounded termination
type: glossary-term
lesson: "0009"
phase: 1
category: hermes
status: introduced
introduced: 2026-08-15
tags:
  - glossary
  - hermes
---

# termination

The guarantee that a job ends after finitely many model calls, with a classified outcome.

Both halves matter. The loop must end, and the exit must be named. A loop that only crashes has ended, but nothing downstream can act on a crash the way a supervisor acts on `over_budget`.

The bounds that provide the guarantee come from the [[task-spec]]: a call cap, a token ceiling, and a deadline. Each has a safe default, so a spec file that says nothing still terminates.

**In [[lesson-0009-bounds-and-termination|lesson 0009]]:** lesson 0008's literal `MAX_MODEL_CALLS` became `spec.maxModelCalls`, and the outcome union gained `over_budget` and `out_of_time`. Every exit path of `runTask` returns a report.

**Why it matters for Hermes:** scenario step S6 (the budget is enforced) is a termination claim: no job outruns its ceiling or its clock. The [[job-supervisor]] can only make that claim because every bound produces a classified exit.

**Related:** [[tool-loop]] · [[task-spec]] · [[partial-artifact]] · [[cancellation]] · [[job-supervisor]]
