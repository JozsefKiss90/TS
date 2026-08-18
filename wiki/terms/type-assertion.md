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

Telling the compiler that a value has a type, with no runtime check. It is the opposite move from [[narrowing]]. A narrowing check earns the specific type, and an assertion declares it.

**In [[lesson-0001-trace-one-request|lesson 0001]]:** the last step of the [[sdk]]'s response pipeline. Bytes arrive, `JSON.parse` produces an untyped value, and an assertion attaches `Message`. Nothing has compared one field to the interface by that point.

**Why it matters for Hermes:** an assertion is a bet. The SDK's own responses make it a fair one, because the types come from the server's specification and the [[api-version-header]] pins the rules. No version header pins model output, so Hermes replaces the assertion with [[runtime-validation]] at that boundary.

**Related:** [[type-erasure]] · [[narrowing]] · [[runtime-validation]] · [[sdk]] · [[messages-api]]
