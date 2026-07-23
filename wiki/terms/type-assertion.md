---
term: Type assertion
aliases:
  - as-cast
type: glossary-term
lesson: "0001"
phase: 0
category: type-system
status: demonstrated
introduced: 2026-07-23
demonstrated: 2026-07-23
tags:
  - glossary
  - type-system
---

# Type assertion

Telling the compiler a value has a type **without any runtime check** — morally `parsed as Message`. The opposite move from [[narrowing]], which *earns* the specific type by testing the value; an assertion just declares it.

**In [[lesson-0001-trace-one-request|lesson 0001]]:** the last step of the [[sdk]]'s response pipeline — bytes → `JSON.parse` → assertion → trusted label. This is the precise mechanism behind "response types are compile-time claims about runtime bytes": the assertion is where the claim gets stamped on, and nothing has checked the bytes by that point.

**Why it matters for Hermes:** an assertion is a bet. For SDK responses it's reasonable (spec-generated types + the [[api-version-header]] pinning the contract). For model-generated data no version header pins anything — which is why Hermes replaces the assertion with [[runtime-validation]] at every such boundary.

**Related:** [[type-erasure]] · [[narrowing]] · [[runtime-validation]] · [[sdk]] · [[messages-api]]
