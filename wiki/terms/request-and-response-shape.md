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

# Request and response shape

The body fields a request must carry, and the fields the reply returns. For the [[messages-api]] the request requires `model`, `max_tokens`, and `messages`. The server enforces the shape at runtime. The [[sdk]] mirrors it as TypeScript parameter types, so a missing `max_tokens` fails compilation instead of costing a round trip.

**In [[lesson-0001-trace-one-request|lesson 0001]]:** responsibility ④. The mirror checks only your outbound code. [[type-erasure|Type erasure]] means no inbound byte is ever checked against it.

**Naming record:** this note was slugged `request-contract` until 2026-08-16. *Contract* names the TaskSpec alone, per the 2026-08-08 ruling.

**Related:** [[messages-api]] · [[api]] · [[type-erasure]] · [[runtime-validation]]
