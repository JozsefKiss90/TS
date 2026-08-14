---
term: Type erasure
aliases:
  - types are erased at runtime
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

# Type erasure

TypeScript types exist at compile time only. The compiler strips them before the code runs. An [[sdk]]'s response types are therefore compile-time claims about runtime bytes. The SDK parses whatever JSON arrives and asserts that it matches. Nothing checks the bytes against the declaration.

**In [[lesson-0001-trace-one-request|lesson 0001]]:** quiz Q2 asks what the response type guarantees about the bytes. The answer is nothing. The compile-time-versus-runtime exercise turns on the same fact, and [[narrowing]] convinces the compiler alone.

**Why it matters for Hermes:** static types improve structural correctness and then vanish at run time. Every JSON boundary therefore needs [[runtime-validation]]: model output, tool arguments and retrieved evidence. A type annotation at a boundary guarantees nothing about the bytes.

**Related:** [[runtime-validation]] · [[narrowing]] · [[discriminated-union]] · [[sdk]]
