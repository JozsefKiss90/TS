---
term: graph interpreter
aliases:
  - interpreter
  - runGraph
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

# graph interpreter

The loop that runs one node handler, checks the move against the graph, writes a checkpoint, and moves.

One step has four parts. Run the [[node-handler|handler]] of the current node. Ask the [[workflow-graph|workflow graph]] for an open edge from here to the node the handler wants, and refuse if there is none. Write a [[checkpoint]]. Move, and let a [[terminal-node|terminal node]] end the run.

The function `runGraph(graph, guards, handlers, from, ctx)` knows nothing about jobs. The state and context types are parameters, and the node names are whatever the graph declares.

The edge question is the walker's question from lesson 0017, asked before the move instead of after the run. Both call `findOpenEdge`. A refusal is a typed result, `no_edge` or `guard_refused`, with the step number and the two node names. No checkpoint records a refused move, and the trace ends without a `job_ended`.

**In [[lesson-0018-the-loop-walks-the-graph|lesson 0018]]:** `src/interpreter.ts`. With the edge `tool_ran > calling` removed from the graph file, the audit job stops at step 5 with a typed refusal. One model call was made of the two the fake held, and the last checkpoint is at step 4. With the edge check skipped, 4 tests fail. With the checkpoint save removed, 7 fail.

**Why it matters for Hermes:** scenario step S3 (dispatch under the graph). A job can only make a move the graph holds, so the graph is what Hermes may do, and lesson 0021 derives it from the spec.

**Related:** [[node-handler]] · [[checkpoint]] · [[workflow-graph]] · [[guard]] · [[trace]]
