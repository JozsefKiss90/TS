---
term: Spec-to-Evidence Loop
aliases:
  - the loop
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

# Spec-to-Evidence Loop

> The governed lifecycle through which Hermes transforms an admitted job specification into a verified terminal outcome supported by persistent evidence.

*(Proposed clarification — supplement 0006b's operational expansion of the course mission sentence; the course has used the phrase since session 1 without defining it.)* Expanded: **specify → validate → admit → ground → plan → select capability → execute → verify → decide → record → continue/suspend/terminate.** It is a *loop* because **verification or new evidence can send the job backward** — to grounding, planning, capability selection, execution, or human clarification — and **not** because model calls repeat: the audit walkthrough loops zero times through a model.

**In supplement [0006b](../../lessons/0006b-the-hermes-control-plane.html):** the stages are §6's proposed state machine with verbs; evidence is ten categories (governance, semantic, project/code, source/provenance, retrieval, execution, verification, approval, operational/cost, trace) of which Graph RAG retrieval is exactly one — retrieval *proposes, never admits*.

**Why it matters for Hermes:** this is the thing the whole course is building — the [[model-gateway]] (0006), the TaskSpec (0007), bounds (0009), gates (0010), and the trace (0011) are each one organ of this lifecycle, and the three graphs (knowledge · workflow · trace, [[hermes-integration]]) stay separate so [[drift|Drift]] stays detectable inside it.

**Related:** [[hermes-job]] · [[job-supervisor]] · [[capability-routing]] · [[drift]] · [[artifact-vault]]
