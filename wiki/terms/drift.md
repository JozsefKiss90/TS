---
term: Drift
aliases:
  - intent-reality disagreement
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

# Drift

The disagreement between **engineering intent** (a canonical `dev_graph` node — what should be true) and **current reality** (filesystem/Git code truth — what is). Accepted rule (ADR-0003, PDR-001 §4 Sharpening A): **neither side wins by rank** — Drift is a *blocking defect artifact* (drift report / Open Decision), never auto-resolved. Silent corruption of canonical truth is the system's #1 ranked failure (D-003), which is why the response to Drift is to *stop and surface*, not to reconcile.

**In supplement [0006b](../../lessons/0006b-the-hermes-control-plane.html):** Drift is the `blocked` transition in the proposed state machine — grounding that surfaces a graph-versus-code disagreement parks the job on governance, not on retry. It is also *why the three graphs never merge*: merging knowledge (intent) with trace (reality) would let one side silently win.

**Why it matters for Hermes:** Drift is the standing separation's payoff — the course's rule that knowledge, workflow, and trace graphs stay apart (course spine, [[hermes-integration]]) exists precisely so this disagreement remains *detectable* forever.

**Related:** [[context-pack]] · [[spec-to-evidence-loop]] · [[hermes-job]] · [[hermes-integration]]
