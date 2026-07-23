---
term: ModelGateway
type: glossary-term
lesson: "0001"
phase: 0
category: hermes
status: introduced
introduced: 2026-07-23
tags:
  - glossary
  - hermes
---

# ModelGateway

Hermes' planned interface between its domain logic and any model provider. Domain code depends on the local `ModelGateway` interface; providers plug in as adapters (`AnthropicModelGateway`, `FakeModelGateway` for offline tests). The [[sdk]] lives *inside* an adapter — never in the domain.

**In [[lesson-0001-trace-one-request|lesson 0001]]:** mentioned as the destination — you can't design a gateway around an SDK whose retries, timeouts, and error surface you can't see through. That's why raw HTTP comes before the SDK in the lab sequence.

**Why it matters for Hermes:** the boundary enables offline tests with fakes, provider comparison, SDK upgrades without domain rewrites, and cost-controlled evaluation. Whether provider neutrality is a Phase 1 acceptance criterion is still an open decision (see NOTES.md).

**Related:** [[sdk]] · [[cancellation]] · [[stop-reason]] · [[runtime-validation]]
