---
term: Retry with exponential backoff
aliases:
  - exponential backoff
  - maxRetries
type: glossary-term
lesson: "0001"
phase: 0
category: sdk-layer
status: demonstrated
introduced: 2026-07-23
demonstrated: 2026-07-27
tags:
  - glossary
  - sdk-layer
---

# Retry with exponential backoff

Re-sending a failed request after waiting progressively longer between attempts. **Client policy, not wire behavior**: the [[api]] just returns the 429 or 500; the [[sdk]] chooses to retry connection errors and 408/409/429/5xx responses — twice by default, configurable via `maxRetries` — and also applies a default request timeout (10 minutes in the TypeScript SDK). Raw `fetch` gives you none of this.

**In [[lesson-0001-trace-one-request|lesson 0001]]:** the classification item "a 429 or 500 is automatically retried" — SDK layer — and quiz Q1.

**Why it matters for Hermes:** hidden retries multiply cost and latency. A bounded loop must account for them in its budgets, or two "one-request" iterations can silently become six requests.

**Related:** [[error-boundary]] · [[sdk]] · [[cancellation]]
