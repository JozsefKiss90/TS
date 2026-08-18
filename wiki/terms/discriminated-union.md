---
term: Discriminated union
aliases:
  - tagged union
type: glossary-term
lesson: "0005"
phase: 0
category: type-system
status: demonstrated
introduced: 2026-07-23
demonstrated: 2026-07-29
tags:
  - glossary
  - type-system
---

# Discriminated union

A union of object types that share one literal tag field. The [[messages-api]]'s content blocks each carry `type: "text" | "tool_use" | …`, and the [[sdk]] mirrors that union in TypeScript. A [[narrowing]] check on the tag yields the specific member safely.

**First seen in [[lesson-0001-trace-one-request|lesson 0001]]:** why `message.content` cannot be read as text directly. **In [[lesson-0005-validate-the-boundary|lesson 0005]]:** `safeParse` returns one, and the lab narrows it on `success`.

**Why it matters for Hermes:** run states, tool results, and loop events are tagged unions the compiler can check exhaustively.

**Related:** [[narrowing]] · [[messages-api]] · [[safe-parse]] · [[type-erasure]]
