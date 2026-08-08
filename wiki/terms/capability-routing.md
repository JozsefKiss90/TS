---
term: capability routing
aliases:
  - Capability Router
  - capability decision
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

# Capability routing

The decision about **which *kind* of executor performs a job step** — before any model can be named. The sequence, in order: deterministic operation? → authoritative evidence already on file? → retrieval? → probabilistic synthesis? → repository implementation? → human judgement? → and is the choice currently *permitted*? The ordering rule is accepted (ADR-0007: *deterministic scripts run before model calls; a frontier model never inspects work already failing schema/lint/graph checks*; ADR-0012: script-only preferred); the **Capability Router as a named component is a proposed clarification** of supplement 0006b.

Distinguish three decisions with three owners: **capability routing** (which kind of executor), **model routing** ([[routing-policy]] — which eligible model route, only for steps already approved for reasoning), and **Claude Code dispatch** (which bounded repo job — never a third model route, ADR-0001).

**In supplement [0006b](../../lessons/0006b-the-hermes-control-plane.html):** the audit walkthrough's moment 7 — most of the audit's steps end at "a script answers this"; exactly one kind of step (synthesis over the evidence bundle) survives to model routing.

**Why it matters for Hermes:** S4's "routing" compresses all three decisions into one word; letting model routing absorb capability routing is how "Hermes uses an LLM somewhere" becomes an architecture.

**Related:** [[routing-policy]] · [[capability-gateway]] · [[job-supervisor]] · [[model-gateway]] · [[hermes-policy]]
