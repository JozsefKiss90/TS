---
term: Context Pack
aliases:
  - pack
  - admissibility-checked context
type: glossary-term
lesson: "0006b"
phase: 1
category: hermes
status: introduced
introduced: 2026-07-30
tags:
  - glossary
  - hermes
---

# Context Pack

The **admitted evidence a job is dispatched with**. It is assembled from the knowledge graph, checked at the boundary, and refused rather than trimmed.

One meaning, at two scopes. The record below sets the full scope, and lesson 0016 builds a smaller one. The difference is how much a pack contains, not what the words mean.

## The record's scope

A dispatched [[hermes-job|Hermes job]] must carry canonical nodes, constraints, code truth, permitted docs, and acceptance criteria, marked `admitted: true`. The blueprint's 8-step protocol assembles it and 9 admissibility checks admit it (accepted, ADR-0002/0020). The protocol runs in this order: semantic retrieval proposes, frontmatter admits, graph traversal expands, the filesystem and Git ground, permitted docs supply.

*No pack → no dispatch.* Script-only work (`--no-agent`) is pack-exempt, because no model interprets context. Memory enters only as a labeled advisory block (ADR-0011). CodeGraph evidence enters as a distinct derived-read-only section, downgraded to advisory when stale (ADR-0004).

**In supplement [0006b](../../lessons/0006b-the-hermes-control-plane.html):** grounding is the walkthrough's moment 3. The pack raises lesson 0005's boundary rule one level. Not "nothing crosses a boundary unvalidated" but *nothing enters what an agent is allowed to believe unadmitted*.

**In [[lesson-0016-evidence-enters-the-loop|lesson 0016]]:** the lab's pack holds the merged answers to a job's `evidenceQueries`, and `admitContextPack` is the check. Four rules, not nine: at least one query row, at least one item, one snapshot across the rows, and each id once. Every rule of the [[evidence-item|evidence schema]] also runs, because `ContextPackSchema` nests it. A fifth rule lives in the supervisor rather than the schema, because the schema never sees the spec. The pack must answer the spec's queries and no others. Assembly is one query per spec entry, where the record names eight steps.

**Why it matters for Hermes:** the pack is where the knowledge graph's authority ([[hermes-integration]]) is enforced. Step S2 (evidence assembled) makes *no pack, no dispatch* a mechanical gate on the Hermes side, so no single job can forget it.

**Related:** [[hermes-job]] · [[job-envelope]] · [[evidence-port]] · [[evidence-item]] · [[admissibility-check]] · [[drift]] · [[json-boundary]] · [[runtime-validation]]
