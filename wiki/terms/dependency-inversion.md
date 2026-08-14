---
term: Dependency inversion
aliases:
  - dependency direction
type: glossary-term
lesson: "0006"
phase: 1
category: type-system
status: introduced
introduced: 2026-07-29
tags:
  - glossary
  - type-system
---

# Dependency inversion

The build-time dependency arrow turns around at a boundary. Domain code stops importing a concrete dependency, and so stops inheriting its types, exceptions and vocabulary. The domain declares a [[port]] it owns, and the concrete side depends on that, through `implements` and imports.

The inversion is measurable in import statements. It exists at build time only ([[type-erasure]]), and the type-checker enforces it. No runtime mechanism is involved.

**In [[lesson-0006-the-model-gateway|lesson 0006]]:** the clients of exercises 02 to 04 import `@anthropic-ai/sdk` directly. After the change, `supervisor.ts` imports `gateway.ts` and nothing else. Both `anthropic-gateway.ts` and `fake-gateway.ts` import the port in order to implement it. One command checks the result. `grep -r "@anthropic-ai/sdk" src/` must hit the [[adapter]] and the wiring in `main.ts`, never a domain file.

**Why it matters for Hermes:** this is the guarantee behind S4 (model calls) and its split between mechanics and policy. Provider decisions, SDK upgrades and offline testing ([[fake]]) all become possible because nothing above the port names the provider.

**Related:** [[port]] · [[adapter]] · [[fake]] · [[type-erasure]] · [[model-gateway]]
