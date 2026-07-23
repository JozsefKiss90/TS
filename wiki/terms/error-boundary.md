---
term: Error boundary
aliases:
  - typed errors
type: glossary-term
lesson: "0001"
phase: 0
category: sdk-layer
status: introduced
introduced: 2026-07-23
tags:
  - glossary
  - sdk-layer
---

# Error boundary

The place where transport and HTTP failures become program decisions. The [[api]] only hands you a status code (401, 429, 529…); raw `fetch` makes you write every branch yourself, while the [[sdk]] raises **typed error classes** (`Anthropic.RateLimitError`, …) you can `instanceof` against, after first applying its own [[retry-with-backoff|retry policy]].

**In [[lesson-0001-trace-one-request|lesson 0001]]:** responsibility ⑤ of the six — `if (!res.ok) throw` versus `catch (err) { if (err instanceof Anthropic.RateLimitError) … }`.

**Why it matters for Hermes:** which errors are retried, surfaced, or escalated is **policy**, and Hermes' policy must live in its own loop — visible and testable — not implicitly inside a library default.

**Related:** [[retry-with-backoff]] · [[sdk]] · [[api]]
