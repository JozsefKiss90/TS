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

The **admitted evidence bundle** a dispatched [[hermes-job|Hermes job]] must carry: canonical nodes, constraints, code truth, permitted docs, and acceptance criteria — assembled by the blueprint's 8-step protocol (*semantic retrieval proposes → frontmatter admits → graph traversal expands → filesystem/Git grounds → permitted docs supply*), passing 9 admissibility checks, and marked `admitted: true` (accepted — ADR-0002/0020). *No pack → no dispatch*; script-only (`--no-agent`) work is pack-exempt because no model interprets context. Memory enters only as a labeled advisory block (ADR-0011); CodeGraph evidence enters as a distinct derived-read-only section, downgraded to advisory when stale (ADR-0004).

**In supplement [0006b](../../lessons/0006b-the-hermes-control-plane.html):** grounding is the walkthrough's moment 3 — the pack is the boundary rule of lesson 0005 raised one level: not "nothing crosses a boundary unvalidated" but *nothing enters what an agent is allowed to believe unadmitted*.

**Why it matters for Hermes:** the pack is where the knowledge graph's authority ([[hermes-integration]]) is actually enforced — S2's "no pack → no dispatch" is a mechanical gate on the Hermes side, so it cannot be forgotten per-job.

**Related:** [[hermes-job]] · [[job-envelope]] · [[drift]] · [[json-boundary]] · [[runtime-validation]]
