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

The family of compiler flags that decide **what a compile-time claim is allowed to hide**. `strict: true` is the umbrella (no implicit `any`; `null`/`undefined` are real types you must handle); the lab adds the sharper edges: `noUncheckedIndexedAccess` (indexing may miss, so `arr[0]` is `T | undefined`), `exactOptionalPropertyTypes` (an omitted property and one set to `undefined` are different things — JSON has no `undefined`), and `verbatimModuleSyntax` ([[type-erasure]] enforced at the syntax level).

**In [[lesson-0002-raw-http-against-a-mock|lesson 0002]]:** `tsconfig.base.json` is read as course material, line by line. The flags bite in `client.ts` the moment you print `content[0]` — the compiler insists you handle the miss.

**Why it matters for Hermes:** the guiding principle is *probabilistic reasoning inside a deterministic, typed, observable control system* — and the type system is only as trustworthy as the claims it refuses to let through. Strictness maximizes what the compiler can police, which sharpens exactly where [[runtime-validation]] must take over: the JSON boundaries.

**Related:** [[type-erasure]] · [[type-assertion]] · [[narrowing]] · [[runtime-validation]] · [[es-modules]]
