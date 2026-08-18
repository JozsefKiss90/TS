---
term: stop_reason
type: glossary-term
lesson: ""
phase: 0
category: protocol
status: demonstrated
introduced: 2026-07-23
demonstrated: 2026-07-27
tags:
  - glossary
  - protocol
---

# stop_reason

The [[messages-api]] response field that says why generation ended: end of turn, `max_tokens`, a stop sequence, or a tool call. The [[api]] defines it, so loop logic branches on it identically in every language.

**First seen in [[lesson-0001-trace-one-request|lesson 0001]]** as a classification item: an API rule, not an [[sdk]] choice. **In [[lesson-0002-raw-http-against-a-mock|lesson 0002]]:** the lab reads it out of the raw response body. On the streaming path it arrives only in `message_delta`, at the end, per lesson 0004.

**Why it matters for Hermes:** the bounded loop's termination logic branches on `stop_reason` every iteration. It is the wire signal behind the [[model-gateway]]'s stop decision.

*Demoted to ordinary vocabulary on 2026-08-17: it is a literal code identifier, marked up as code wherever it appears. The note stays as a reference.*

**Related:** [[messages-api]] · [[model-gateway]] · [[api]] · [[delta]]
