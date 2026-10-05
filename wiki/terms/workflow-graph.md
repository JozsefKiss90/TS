---
term: workflow graph
aliases:
  - WorkflowGraph
  - state graph
  - job lifecycle graph
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

# workflow graph

The states a job may be in and the moves it may make between them, held as data.

The knowledge graph holds what Hermes knows, the [[trace]] holds what one job did, and this holds what a job may do. The three never merge. A strict shape keeps it that way. A graph file is six fields of names, and a `claims` key or an `events` key is refused at the root.

Each [[trace]] event enters one node, so the nodes are the moments the [[job-supervisor|supervisor]] already records. An edge is a pair of events the code can write back to back. A [[guard]] is a named rule on an edge, and a [[terminal-node|terminal node]] is a state with no way out.

**In [[lesson-0017-thinking-in-state-graphs|lesson 0017]]:** the file `graphs/job-lifecycle.json` holds 13 nodes, 26 edges and 6 guard names, read from the supervisor. The parse `admitWorkflowGraph` is a [[safe-parse]] with four refinements. The function `walk` replays a trace along the graph with zero model calls. Six recorded runs are legal paths that take 10 of the 26 edges.

**Why it matters for Hermes:** scenario step S3 (dispatch under the graph) is a job running inside this record. Hermes's own state set is a proposed clarification in `hermes-job-control-plane.md` §4, and the lab's node names come from the supervisor, not from that proposal.

**Related:** [[guard]] · [[terminal-node]] · [[trace]] · [[job-supervisor]] · [[safe-parse]] · [[zod-schema]] · [[spec-to-evidence-loop]]
