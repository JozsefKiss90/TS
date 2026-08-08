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

An interface **owned by the caller's side** of a boundary: the domain declares, in its own vocabulary, what it needs from the outside world, and implementations plug in from below. The dependency arrow points *at* the port from both sides ([[dependency-inversion]]). A port survives compilation as **nothing** — it is [[type-erasure|erased]] like every interface — so it is not a runtime guard but discipline made checkable: the type-checker enforces it at every `implements` and every import.

**In [[lesson-0006-the-model-gateway|lesson 0006]]:** `gateway.ts` is the port — `ModelCall`, `ModelReply`, `GatewayResult`, and the `ModelGateway` interface, importing nothing. The [[base-url]] seam (lesson 0002) was the same idea one level down: a config value swapped implementations at the wire; a port swaps them at the type level. Not to be confused with TCP port 8787 — same word, different boundary.

**Why it matters for Hermes:** scenario step S4 — model calls go through the ModelGateway with mechanics below and policy above. The port is what makes the loop offline-testable ([[fake]]) and provider-neutral by construction: every word in it is one Hermes chose.

**Related:** [[adapter]] · [[fake]] · [[dependency-inversion]] · [[model-gateway]] · [[base-url]] · [[type-erasure]]
