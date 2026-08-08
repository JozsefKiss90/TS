---
term: Narrowing
aliases:
  - type narrowing
type: glossary-term
lesson: "0001"
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

Convincing the TypeScript compiler that a value has a more specific type by checking it — `if (block.type === "text")` narrows a content block so `.text` is safe to access. On a [[discriminated-union]], checking the tag field is the idiomatic narrowing move.

**In [[lesson-0001-trace-one-request|lesson 0001]]:** the SDK snippet's `for` loop narrows each response block before touching `.text`. The classification trap: narrowing lives in the type layer only — it is [[type-erasure|erased at runtime]], so it validates your *code paths*, not the *bytes*.

**Why it matters for Hermes:** narrowing plus exhaustiveness checks is how typed loop states and tool results stay honest at compile time; [[runtime-validation]] covers what narrowing can't.

**Related:** [[discriminated-union]] · [[type-erasure]] · [[runtime-validation]]
