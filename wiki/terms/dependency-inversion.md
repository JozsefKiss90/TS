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

Turning the compile-time dependency arrow around at a boundary: instead of domain code importing a concrete dependency (and inheriting its types, exceptions, and vocabulary), the domain declares a [[port]] it owns, and the concrete side depends on *that* — via `implements` and imports. The inversion is measurable in import statements: it exists entirely at compile time ([[type-erasure]]) and is enforced by the type-checker, not by any runtime mechanism.

**In [[lesson-0006-the-model-gateway|lesson 0006]]:** before — exercises 02–04's clients import `@anthropic-ai/sdk` directly; after — `supervisor.ts` imports only `gateway.ts`, while `anthropic-gateway.ts` (and `fake-gateway.ts`) import the port to implement it. The check is one command: `grep -r "@anthropic-ai/sdk" src/` must hit only the [[adapter]] and the wiring in `main.ts`, never a domain file.

**Why it matters for Hermes:** the guarantee behind S4's mechanics/policy split — provider decisions, SDK upgrades, and offline testing ([[fake]]) all become possible *because* nothing above the port names the provider.

**Related:** [[port]] · [[adapter]] · [[fake]] · [[type-erasure]] · [[model-gateway]]
