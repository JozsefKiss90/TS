---
term: terminal node
aliases:
  - terminal state
type: glossary-term
lesson: "0017"
phase: 3
category: hermes
status: introduced
introduced: 2026-10-06
tags:
  - glossary
  - hermes
---

# terminal node

A state a run may end in. No edge leaves it.

The job lifecycle has six: `landed`, `retry_later`, `gave_up`, `over_budget`, `out_of_time` and `no_evidence`. They are the six outcomes a `job_ended` event can carry, so the [[trace]] and the [[workflow-graph|workflow graph]] agree on where a run can stop.

A graph whose edge leaves a terminal node is refused by the parse. A trace that stops before reaching one is legal and incomplete. That is lesson 0011's finding in the walker's words: a record with no `job_ended` was cut short.

**In [[lesson-0017-thinking-in-state-graphs|lesson 0017]]:** the fourth refinement of `WorkflowGraphSchema`, and the `complete` flag on a successful walk.

**Why it matters for Hermes:** Hermes's accepted terminal words are `done` and `failed`, per `hermes-job-control-plane.md` §4. The lab's six are finer, and mapping them onto Hermes's two is an open decision that record names.

**Related:** [[workflow-graph]] · [[guard]] · [[termination]] · [[trace]]
