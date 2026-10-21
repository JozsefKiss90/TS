---
term: checkpointer
aliases:
  - MemorySaver
  - BaseCheckpointSaver
  - saver
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

# checkpointer

The LangGraph.js object that saves the framework's state after each step, grouped by thread.

It is passed to `compile({ checkpointer })`. `MemorySaver` keeps its records in memory, so they end with the process. Other savers write to a database. `interrupt()` refuses to run without one, because a paused run has to be kept somewhere.

It is not lab 12's [[checkpoint]]. Lab 12's checkpoint is one file per job, written through a [[port]] after every move, holding the node entered next and the job state. The checkpointer's record holds the framework's whole state, keyed by [[thread]], after every framework step.

**In [[lesson-0020-langgraph-js-evaluated|lesson 0020]]:** the audit with one tool call writes 7 lab 12 checkpoints and 10 framework checkpoints (part a). Under lab 12's port each call gets a fresh `MemorySaver`, and its records are discarded when the call returns. In the framework's own resume, the saver keeps the paused thread until `Command({ resume })` arrives.

**Why it matters for Hermes:** the Phase 3 guardrail says a checkpoint is workflow state and the trace is what happened. A framework checkpointer keeps a second record of the workflow, beside lab 12's. Lesson 0021 decides which one Hermes keeps.

**Related:** [[checkpoint]] · [[thread]] · [[parked-run]] · [[approval-queue]] · [[conditional-edge]]
