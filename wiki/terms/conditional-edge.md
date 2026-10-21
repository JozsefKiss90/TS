---
term: conditional edge
aliases:
  - addConditionalEdges
  - router
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

# conditional edge

An edge whose target a router function picks at run time, from a list of allowed targets.

In LangGraph.js a node's function returns new state, and the edges out of the node decide what runs next. A plain edge always goes to one target. A conditional edge calls a function, the router, with the state, and goes where the router says. The third argument of `addConditionalEdges(source, router, targets)` lists every target the router may name. A target outside that list is an error.

**In [[lesson-0020-langgraph-js-evaluated|lesson 0020]]:** each node of lab 12's [[workflow-graph]] gets one conditional edge. Its list is the edges the graph file draws out of the node, plus `END`. Its router asks lab 12's `findOpenEdge` whether the move the [[node-handler|handler]] wants is allowed, so the [[guard|guards]] stay Hermes's code. A refused move routes to `END`. With the router's question removed, 2 of lab 13's 83 tests fail: the two guard refusals.

**Why it matters for Hermes:** scenario step S3 (dispatch under the graph) puts the rules on the edges. A framework that chooses the next node is safe to adopt only if the rule that allows the move is still the one Hermes wrote.

**Related:** [[workflow-graph]] · [[guard]] · [[graph-interpreter]] · [[checkpointer]] · [[port]]
