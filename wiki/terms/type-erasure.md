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

TypeScript types exist only at compile time — they are stripped before the code runs. An [[sdk]]'s response types are therefore **compile-time claims about runtime bytes**: the SDK parses whatever JSON arrives and *asserts* it matches; nothing checks the bytes against the declaration.

**In [[lesson-0001-trace-one-request|lesson 0001]]:** the central catch — quiz Q2 ("what does the response type guarantee about the bytes? Nothing") and the compile-time-vs-runtime exercise both hinge on it. [[narrowing]] likewise only convinces the compiler.

**Why it matters for Hermes:** this is the root of the guiding principle — static types improve structural correctness but vanish at runtime, so every JSON boundary (model output, tool arguments, retrieved evidence) needs [[runtime-validation]]. Trusting a type annotation at a boundary is trusting nothing.

**Related:** [[runtime-validation]] · [[narrowing]] · [[discriminated-union]] · [[sdk]]
