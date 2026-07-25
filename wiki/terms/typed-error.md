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

A failure surfaced as a distinct class per failure family instead of a status code you branch on by hand. The SDK maps HTTP statuses to subclasses of `APIError` (`AuthenticationError` 401, `RateLimitError` 429, …) plus non-HTTP families (`APIUserAbortError`, `APIConnectionTimeoutError`), each carrying structured fields — `.status`, `.type`, `.requestID`, `.headers`. The [[error-boundary]] becomes an `instanceof` chain, most specific first, instead of `if (!res.ok)` plus a hand-parsed envelope.

**In [[lesson-0003-the-sdk-absorbs-the-six|lesson 0003]]:** `catch (err) { if (err instanceof RateLimitError) … }` — with `err.headers.get("retry-after")` replacing exercise 01's manual header read. Read the whole hierarchy in `core/error.d.ts` (a [[declaration-file]]).

**Why it matters for Hermes:** retryable vs non-retryable is a *typed* distinction, which lets Phase 1's loop encode failure policy (back off, escalate, fail the task) as code instead of string matching.

**Related:** [[error-boundary]] · [[retry-with-backoff]] · [[request-options]] · [[declaration-file]]
