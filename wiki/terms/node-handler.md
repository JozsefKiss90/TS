---
term: node handler
aliases:
  - handler
  - NodeHandler
type: glossary-term
lesson: "0018"
phase: 3
category: hermes
status: introduced
introduced: 2026-10-07
tags:
  - glossary
  - hermes
---

# node handler

The function that does one node's work and names the node it wants next.

A handler takes the job state and a context and returns a `Step`. A step names the node the handler wants, the state after its work, and the event it recorded. It records exactly one event, the one the walker of lesson 0017 maps to its node. It never decides whether the move is allowed. The [[graph-interpreter|interpreter]] asks the [[workflow-graph|workflow graph]] that question, and a [[guard]] on the edge reads the event the handler just recorded.

The job lifecycle has seven handlers, for `started`, `grounded`, `calling`, `replied`, `gating`, `awaiting_approval` and `tool_ran`. Each is the matching stretch of lab 07's supervisor, moved. The six [[terminal-node|terminal nodes]] have none: reaching one ends the job, and the node's name is the outcome.

**In [[lesson-0018-the-loop-walks-the-graph|lesson 0018]]:** `src/handlers.ts` holds the seven. The supervisor's loop, its three `continue` statements and its fifteen early returns are gone, and 23 handler returns name a node instead, through three helpers. Nine scenarios through both the supervisor and the handlers return the same report and the same events.

**Why it matters for Hermes:** scenario step S3 (dispatch under the graph) needs the work and the control flow apart. Lesson 0021 derives the graph from a spec, and that graph decides which moves exist without touching the work.

**Related:** [[graph-interpreter]] · [[workflow-graph]] · [[guard]] · [[checkpoint]] · [[job-supervisor]]
