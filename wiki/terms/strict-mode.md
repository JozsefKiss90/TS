---
term: Strict mode (TypeScript)
aliases:
  - strict
  - noUncheckedIndexedAccess
  - exactOptionalPropertyTypes
type: glossary-term
lesson: "0002"
phase: 0
category: type-system
status: introduced
introduced: 2026-07-23
tags:
  - glossary
  - type-system
---

# Strict mode (TypeScript)

The family of compiler flags that decide what a compile-time claim may hide. The umbrella is `strict: true`: no implicit `any`, and `null` and `undefined` become real types your code must handle. The lab adds sharper flags. The flag `noUncheckedIndexedAccess` gives every indexed read an `undefined` arm. Next, `exactOptionalPropertyTypes` keeps an omitted property distinct from one set to `undefined`. Last, `verbatimModuleSyntax` enforces [[type-erasure]] at the syntax level.

**In [[lesson-0002-raw-http-against-a-mock|lesson 0002]]:** `tsconfig.base.json` is course material, read line by line. The flags bite in `client.ts` the moment you print `content[0]`. The compiler insists you handle the miss.

**Why it matters for Hermes:** the mission puts probabilistic reasoning inside a deterministic, typed control system. Strictness raises what the compiler can check. That sharpens where [[runtime-validation]] must take over: the JSON boundaries.

**Related:** [[type-erasure]] · [[type-assertion]] · [[narrowing]] · [[runtime-validation]] · [[es-modules]]
