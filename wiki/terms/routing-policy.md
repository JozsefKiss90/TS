---
term: Routing policy
aliases:
  - model routing
  - model selection policy
type: glossary-term
lesson: "0006a"
phase: 1
category: hermes
status: introduced
introduced: 2026-07-29
tags:
  - glossary
  - hermes
---

# Routing policy

The future [[hermes-policy]] that would **select a model route per task** — which provider, which model, at what cost class — as a deterministic rule over validated task requirements. **It does not exist yet, and no roadmap row schedules it.** Today the model id is a constant in the [[composition-root]] (`main.ts`), and provider selection is not implemented at all; MISSION rules out building either speculatively.

**In supplement [0006a](../../lessons/0006a-hermes-architecture-primer.html):** the load-bearing sentence — *lesson 0006 reserves model selection for policy; it does not yet implement model-selection policy.* The reservation is real: injecting the model id into the [[adapter]]'s constructor keeps the adapter from owning the choice, so when a router arrives it arrives as a rule above the [[port]] constructing or selecting a configured gateway — not as a rewrite.

**Why it matters for Hermes:** S4 names "routing, provider, model choice" as the policy above the ModelGateway; in Hermes OS this is the model router's policy half. Keeping the term separate from wiring prevents the overclaim that exercise 05 already routes.

**Related:** [[hermes-policy]] · [[composition-root]] · [[model-gateway]] · [[port]] · [[adapter]]
