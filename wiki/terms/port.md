---
term: Port
aliases:
  - ports and adapters
  - hexagonal architecture
type: glossary-term
lesson: "0006"
phase: 1
category: hermes
status: introduced
introduced: 2026-07-29
tags:
  - glossary
  - hermes
---

# Port

An interface the caller owns, written in the caller's own words. The domain declares what it needs from the outside world. Implementations plug in from below.

The dependency arrow points at the port from both sides ([[dependency-inversion]]). A port survives compilation as nothing, because TypeScript [[type-erasure|erases]] every interface. It is not a runtime guard. The type-checker enforces it at every `implements` and every import.

**In [[lesson-0006-the-model-gateway|lesson 0006]]:** `gateway.ts` is the port. It declares `ModelCall`, `ModelReply`, `GatewayResult` and the `ModelGateway` interface, and it imports nothing. The [[base-url]] seam of lesson 0002 was the same idea at the wire. A config value swapped implementations there, and a port swaps them at build time. TCP port 8787 is a different boundary with the same name.

**Why it matters for Hermes:** scenario step S4 puts model calls through the ModelGateway, with mechanics below and policy above. The port is what makes the loop testable offline ([[fake]]). It is also what keeps Hermes provider-neutral, because every word in it is one Hermes chose.

**Related:** [[adapter]] · [[fake]] · [[dependency-inversion]] · [[model-gateway]] · [[base-url]] · [[type-erasure]]
