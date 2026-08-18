---
term: Narrowing
aliases:
  - type narrowing
type: glossary-term
lesson: ""
phase: 0
category: type-system
status: demonstrated
introduced: 2026-07-23
demonstrated: 2026-07-29
tags:
  - glossary
  - type-system
---

# Narrowing

Convincing the compiler that a value has a more specific type by checking it. The check `if (block.type === "text")` narrows a content block, so `.text` is safe to read. On a [[discriminated-union]], checking the tag field is the idiomatic move.

**First seen in [[lesson-0001-trace-one-request|lesson 0001]]:** the SDK snippet narrows each response block before touching `.text`. **In [[lesson-0003-the-sdk-absorbs-the-six|lesson 0003]]:** the same move sorts the SDK's [[typed-error]] classes with `instanceof`. Narrowing checks your code paths, and [[type-erasure]] means it never checks the bytes.

**Why it matters for Hermes:** narrowing plus exhaustiveness keeps typed loop states checkable at compile time. [[runtime-validation]] covers what narrowing cannot.

*Demoted to ordinary vocabulary on 2026-08-18: lessons use this word without a definition. The note stays as a reference.*

**Related:** [[discriminated-union]] · [[type-erasure]] · [[runtime-validation]] · [[typed-error]]
