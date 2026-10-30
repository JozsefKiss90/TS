---
term: golden task
aliases:
  - golden tasks
  - golden-task file
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

# golden task

A stored test case for a whole run: a spec, a recorded [[fixture]], the expected ending, and the names of its graders.

A golden task is written before any run. Its expected ending may be a failure: `capped-audit` expects `failed (gave_up)`, because a correct loop gives up after one call. The task file is a JSON boundary, so `admitGoldenTasks` parses it with Zod. The spec inside it passes the same `TaskSpecSchema` a spec file passes. A grader name with no function behind it is refused before any task runs.

Anthropic's *Demystifying evals for AI agents* (2026-01-09) calls this a task: "a single test with defined inputs and success criteria".

**In [[lesson-0025-golden-tasks|lesson 0025]]:** four tasks in `16-benchmark/tasks/golden.json`, thirteen grades between them. The real loop passes all thirteen.

**Why it matters for Hermes:** scenario step S9 (score the run) scores runs against golden tasks. Hermes OS turns two advisory checks into blocking ones at 30 golden questions (control plane, component 10). Four tasks check the benchmark code. They are not a benchmark of the model.

**Related:** [[grader]] · [[scorecard]] · [[planted-defect]] · [[fixture]] · [[task-spec]] · [[artifact]]
