---
term: ModelGateway
type: glossary-term
lesson: "0006"
phase: 1
category: hermes
status: demonstrated
introduced: 2026-07-23
demonstrated: 2026-07-27
tags:
  - glossary
  - hermes
---

# ModelGateway

Hermes' interface between its domain logic and any model provider. Domain code depends on the local `ModelGateway` interface. Providers plug in below it as adapters, `AnthropicModelGateway` and `FakeModelGateway`. The [[sdk]] lives inside an adapter, never in the domain.

**In [[lesson-0006-the-model-gateway|lesson 0006]]:** the plan became code. `gateway.ts` is the [[port]], and it declares `ModelCall`, `ModelReply` and `GatewayResult`. `AnthropicModelGateway` is the [[adapter]]. It wraps SDK 0.113.0 with the boundary [[safe-parse]], and it returns failures as data. `FakeModelGateway` is the [[fake]] that runs the supervisor offline in 0.6 ms.

**Why it matters for Hermes:** the port makes offline tests, provider comparison and SDK upgrades possible without a domain rewrite. The provider-neutrality decision landed on 2026-07-29 in lesson 0006. Hermes gets a provider-neutral port with one live adapter. Neutrality is a property of the interface, because every word in it is one Hermes chose. The fake is the second implementation, and it keeps that interface in check.

**Related:** [[sdk]] · [[port]] · [[adapter]] · [[fake]] · [[cancellation]] · [[stop-reason]] · [[runtime-validation]]
