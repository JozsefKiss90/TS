---
term: Retry with exponential backoff
aliases:
  - exponential backoff
  - maxRetries
type: glossary-term
lesson: "0003"
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

Re-sending a failed request after waiting longer between attempts. This is client policy, not an API rule. The [[api]] returns the 429 or 500. The [[sdk]] chooses to retry connection errors and 408, 409, 429 and 5xx responses, twice by default, under `maxRetries`.

**First seen in [[lesson-0001-trace-one-request|lesson 0001]]:** the classification item on automatic retries, and quiz Q1. **In [[lesson-0003-the-sdk-absorbs-the-six|lesson 0003]]:** measured against the mock. Three requests over ten seconds honored `retry-after: 5`, and timeouts are retried too.

**Why it matters for Hermes:** hidden retries multiply cost and latency. A bounded loop must account for them, or one request can silently become six.

**Related:** [[error-boundary]] · [[sdk]] · [[cancellation]]
