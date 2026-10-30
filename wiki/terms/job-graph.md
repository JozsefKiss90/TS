---
term: job graph
aliases:
  - graphForSpec
  - per-job graph
type: glossary-term
lesson: "0021"
phase: 3
category: hermes
status: introduced
introduced: 2026-10-30
tags:
  - glossary
  - hermes
---

# job graph

The workflow graph one job runs under: the full graph without the nodes and edges its TaskSpec makes unreachable.

Lab 12's file holds every path any spec could need. A [[task-spec|TaskSpec]] rules some of them out before the job starts. The function `graphForSpec` removes them. Its result goes through `admitWorkflowGraph`, the same strict parse as the file. So a job graph also holds names only, with no claims and no events.

Three rules decide the cuts. An empty `approvalRequired` removes `awaiting_approval`. An empty `evidenceQueries` removes `grounded`. A non-empty `evidenceQueries` removes the edge from `started` to `calling`. No rule removes `gating`, because the model may name a tool the spec never offered.

**In [[lesson-0021-the-spec-decides-the-graph|lesson 0021]]:** the audit's job graph has 11 nodes, 17 edges and 3 [[guard|guards]], against the full graph's 13, 26 and 6. A gate that holds on the audit's graph is refused at step 4 with `no_edge gating > awaiting_approval`, after one model call. Both engines refuse it. The parked audit's recorded trace walks legal on its own job graph and is refused at line 5 on the audit's.

**Why it matters for Hermes:** scenario step S3 (dispatch under the graph) starts from the job graph. Hermes's proposed lifecycle says a `--no-writeback` job skips `awaiting_approval`. The job graph turns that into a missing node.

**Related:** [[workflow-graph]] · [[task-spec]] · [[guard]] · [[approval-gate]] · [[context-pack]] · [[trace]]
