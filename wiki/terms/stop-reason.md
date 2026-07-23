---
term: stop_reason
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

# stop_reason

The [[messages-api]] response field that says **why generation ended** — natural end of turn, `max_tokens` hit, a stop sequence, or a tool call. Defined by the [[api]], so loop logic branching on it works identically in every language.

**In [[lesson-0001-trace-one-request|lesson 0001]]:** a classification-exercise item — API contract, not [[sdk]] layer.

**Why it matters for Hermes:** the bounded loop's termination logic will branch on `stop_reason` on every iteration; it is the wire-level signal behind the [[model-gateway]]'s "continue, call a tool, or stop" decision.

**Related:** [[messages-api]] · [[model-gateway]] · [[api]]
