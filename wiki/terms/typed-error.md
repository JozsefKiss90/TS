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

A failure surfaced as a distinct class per failure family, rather than a status code you branch on by hand. The SDK maps HTTP statuses to subclasses of `APIError`, such as `AuthenticationError` for 401 and `RateLimitError` for 429. It adds families that have no status, `APIUserAbortError` and `APIConnectionTimeoutError`. Each class carries structured fields: `.status`, `.type`, `.requestID` and `.headers`. The [[error-boundary]] becomes an `instanceof` chain, most specific first, in place of `if (!res.ok)` and a hand-parsed envelope.

**In [[lesson-0003-the-sdk-absorbs-the-six|lesson 0003]]:** the client catches `RateLimitError` by class. It reads `err.headers.get("retry-after")` where exercise 01 read the header by hand. Read the whole hierarchy in `core/error.d.ts`, a [[declaration-file]].

**Why it matters for Hermes:** retryable against non-retryable is a typed distinction. Phase 1's loop can therefore encode failure policy as code rather than as string matching. That policy decides to back off, to escalate, or to fail the task.

**Related:** [[error-boundary]] · [[retry-with-backoff]] · [[request-options]] · [[declaration-file]]
