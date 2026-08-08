---
term: ModelGateway
type: glossary-term
lesson: "0001"
phase: 0
category: hermes
status: demonstrated
introduced: 2026-07-23
demonstrated: 2026-07-27
tags:
  - glossary
  - hermes
---

# ModelGateway

Hermes' planned interface between its domain logic and any model provider. Domain code depends on the local `ModelGateway` interface; providers plug in as adapters (`AnthropicModelGateway`, `FakeModelGateway` for offline tests). The [[sdk]] lives *inside* an adapter — never in the domain.

**In [[lesson-0001-trace-one-request|lesson 0001]]:** mentioned as the destination — you can't design a gateway around an SDK whose retries, timeouts, and error surface you can't see through. That's why raw HTTP comes before the SDK in the lab sequence.

**Built in [[lesson-0006-the-model-gateway|lesson 0006]]:** the plan became code. `gateway.ts` is the [[port]] (Hermes-owned `ModelCall`/`ModelReply`/`GatewayResult`); `AnthropicModelGateway` is the [[adapter]] wrapping SDK 0.113.0 with the boundary [[safe-parse]] and failure-as-data classification; `FakeModelGateway` is the [[fake]] that runs the supervisor offline in 0.6 ms.

**Why it matters for Hermes:** the boundary enables offline tests with fakes, provider comparison, SDK upgrades without domain rewrites, and cost-controlled evaluation. The provider-neutrality decision **landed 2026-07-29** (lesson 0006): a provider-neutral port with exactly one live adapter — neutrality is a property of the seam (Hermes-owned vocabulary), not a count of adapters; the fake is the second implementation that keeps the contract honest.

**Related:** [[sdk]] · [[port]] · [[adapter]] · [[fake]] · [[cancellation]] · [[stop-reason]] · [[runtime-validation]]
