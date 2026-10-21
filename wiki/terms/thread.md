---
term: thread
aliases:
  - thread id
  - thread_id
type: glossary-term
lesson: "0020"
phase: 3
category: sdk-layer
status: introduced
introduced: 2026-10-22
tags:
  - glossary
  - sdk-layer
---

# thread

In LangGraph.js, the id under which a checkpointer groups the records of one run.

It is passed as `{ configurable: { thread_id } }` on every `invoke`. A second `invoke` with the same id continues the run the [[checkpointer]] holds for it. A new id starts a new run. It is not an operating-system thread: nothing runs on it, and a Node process can hold many.

**In [[lesson-0020-langgraph-js-evaluated|lesson 0020]]:** lab 12's port gives every `runGraph` call a new random thread, so nothing is ever continued on one. The framework's own resume uses one thread per job. `interrupt()` pauses it at `awaiting_approval`, and `new Command({ resume: "approved" })` with the same id continues it.

**Why it matters for Hermes:** a job already has an identity, the TaskSpec's title in lab 12's checkpoint. Under the framework's resume, the thread id is a second key for the same job. The wiring has to keep the two in step.

**Related:** [[checkpointer]] · [[checkpoint]] · [[parked-run]] · [[conditional-edge]]
