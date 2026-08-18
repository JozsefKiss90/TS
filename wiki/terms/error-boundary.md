---
term: Error boundary
aliases:
  - typed errors
type: glossary-term
lesson: ""
phase: 0
category: sdk-layer
status: introduced
introduced: 2026-07-23
tags:
  - glossary
  - sdk-layer
---

# Error boundary

The place where transport and HTTP failures become program decisions. The [[api]] hands you a status code. Raw `fetch` makes you write every branch. The [[sdk]] raises [[typed-error|typed error classes]] after applying its own [[retry-with-backoff|retry policy]].

**First seen in [[lesson-0001-trace-one-request|lesson 0001]]** as responsibility ⑤. **In [[lesson-0003-the-sdk-absorbs-the-six|lesson 0003]]:** the lab measures the typed classes against the mock, case by case.

*Demoted to ordinary vocabulary on 2026-08-18: lessons use this phrase without a definition. The note stays as a reference.*

**Why it matters for Hermes:** which errors are retried, surfaced, or escalated is policy. Hermes keeps that policy in its own code, visible and testable, not inside a library default.

**Related:** [[typed-error]] · [[retry-with-backoff]] · [[sdk]] · [[api]]
