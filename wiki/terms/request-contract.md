---
term: Request and response shape
aliases:
  - request contract
  - request body contract
type: glossary-term
lesson: "0001"
phase: 0
category: protocol
status: introduced
introduced: 2026-07-23
tags:
  - glossary
  - protocol
---

# Request contract

The body fields the [[api]] requires — for the [[messages-api]]: `model`, `max_tokens`, and `messages` — and their shapes. The contract is enforced by the server at runtime; the [[sdk]] additionally mirrors it as TypeScript parameter types, so omitting `max_tokens` or misspelling `messages` fails **compilation** instead of costing a round-trip.

**In [[lesson-0001-trace-one-request|lesson 0001]]:** responsibility ④ of the six. The compile-time mirror is convenience; the contract itself lives on the wire — but remember [[type-erasure]]: the mirror checks only your outbound code, never inbound bytes.

**Related:** [[messages-api]] · [[api]] · [[type-erasure]] · [[runtime-validation]]
