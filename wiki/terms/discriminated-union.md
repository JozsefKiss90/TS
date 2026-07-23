---
term: Discriminated union
aliases:
  - tagged union
type: glossary-term
lesson: "0001"
phase: 0
category: type-system
status: introduced
introduced: 2026-07-23
tags:
  - glossary
  - type-system
---

# Discriminated union

A union of object types that share a literal **tag field** telling them apart — the [[messages-api]]'s content blocks, each carrying `type: "text" | "tool_use" | …`, are one on the wire, and the [[sdk]] mirrors it in TypeScript. Checking the tag ([[narrowing]]) gives you the specific member safely.

**In [[lesson-0001-trace-one-request|lesson 0001]]:** why `message.content` can't just be `.text`-ed — blocks must be narrowed by their `type` tag first.

**Why it matters for Hermes:** discriminated unions are the backbone of explicit state — run-state variants, tool results, loop events all become tagged unions the compiler can check exhaustively. Coming up properly in the exhaustiveness lesson.

**Related:** [[narrowing]] · [[messages-api]] · [[type-erasure]]
