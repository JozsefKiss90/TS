---
term: Typed error
aliases:
  - error class hierarchy
  - APIError subclass
type: glossary-term
lesson: "0003"
phase: 0
category: sdk-layer
status: introduced
introduced: 2026-07-24
tags:
  - glossary
  - sdk-layer
---

# Typed error

A failure raised as a distinct class per failure family, carrying structured fields, in place of a
status code you branch on by hand. The SDK maps HTTP statuses to subclasses of `APIError`:
`AuthenticationError` for 401, `RateLimitError` for 429. It adds families that have no status,
`APIUserAbortError` and `APIConnectionTimeoutError`. Each class carries `.status`, `.type`,
`.requestID` and `.headers`. Your catch becomes an `instanceof` chain, most specific first, in place
of `if (!res.ok)` and a hand-parsed envelope.

**In [[lesson-0003-the-sdk-absorbs-the-six|lesson 0003]]:** the client catches `RateLimitError` by
class and reads `err.headers.get("retry-after")` where exercise 01 read the header by hand. The whole
hierarchy lives in `core/error.d.ts`, a [[declaration-file]].

**Why it matters for Hermes:** retryable against non-retryable is a typed distinction, so failure
policy can be code rather than string matching. That policy decides to back off, to escalate, or to
fail the task.

**Related:** [[error-boundary]] · [[retry-with-backoff]] · [[request-options]] · [[declaration-file]]
