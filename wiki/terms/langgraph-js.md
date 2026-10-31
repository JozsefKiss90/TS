---
term: LangGraph.js
aliases:
  - LangGraph
  - StateGraph
  - "@langchain/langgraph"
type: glossary-term
lesson: ""
first_used: "0020"
phase: 3
category: sdk-layer
status: introduced
introduced: 2026-10-22
tags:
  - glossary
  - sdk-layer
---

# LangGraph.js

A TypeScript library that runs a graph of functions, and can save and pause the run.

The calls form one object path. The constructor `new StateGraph(Channels)` returns a builder. Each `.addNode(name, fn)` adds a function from state to an update. Each `.addConditionalEdges(source, router, targets)` adds a [[conditional-edge]]. The call `.compile({ checkpointer })` freezes the builder, and `.invoke(input, config)` runs it until no node is left.

It saves its state through a [[checkpointer]], keyed by [[thread]]. A node pauses the run with `interrupt()`, and `new Command({ resume })` on the same thread continues it. The paused node then runs again from its first line.

**First used in [[lesson-0020-langgraph-js-evaluated|lesson 0020]]:** lab 13 puts the library behind lab 12's `runGraph` signature, a [[port]]. Lab 12's 74 tests run unchanged, and all 74 pass. The router still asks Hermes's [[guard|guards]] before every move. Verified against `@langchain/langgraph` 1.4.21.

**In [[lesson-0021-the-spec-decides-the-graph|lesson 0021]]:** [[architecture-decision-record|ADR 0001]] records the decision to skip the library and keep the port. Lab 12's interpreter already resumes from a checkpoint and runs job graphs.

**Why it matters for Hermes:** the library takes over traversal only. The stored record, the resume and the guards stay with Hermes, and Hermes OS keeps job truth in its own files (ADR-0018).

*A reference note: a product name, used in lessons with no definition. It carries no `lesson` id for that reason.*

**Related:** [[checkpointer]] · [[thread]] · [[conditional-edge]] · [[graph-interpreter]] · [[port]] · [[architecture-decision-record]]
