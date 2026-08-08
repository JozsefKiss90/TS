---
term: API client
aliases:
  - client object
  - client instance
type: glossary-term
lesson: "0003"
phase: 0
category: sdk-layer
status: demonstrated
introduced: 2026-07-24
demonstrated: 2026-07-27
tags:
  - glossary
  - sdk-layer
---

# API client

A long-lived, configured object that holds an API's *connection policy* — [[base-url]], credentials, retry policy, timeout — and exposes the API's operations as typed methods. Construction is configuration; calls are use. What exercise 01 scattered across a function (`BASE_URL`, `API_KEY`, headers, `fetch`) the client gathers into one place, and every call inherits those defaults unless a [[request-options]] bag overrides them.

**In [[lesson-0003-the-sdk-absorbs-the-six|lesson 0003]]:** `new Anthropic({ baseURL, apiKey })` — with documented environment fallbacks (`ANTHROPIC_BASE_URL`, `ANTHROPIC_API_KEY`) read straight from the constructor's JSDoc in the [[declaration-file]].

**Why it matters for Hermes:** Phase 1's `AnthropicModelGateway` will *hold* one client and add what the client does not have — budgets, approval, runtime validation. The client is mechanics; the [[model-gateway]] is policy.

**Related:** [[sdk]] · [[base-url]] · [[api-key-authentication]] · [[request-options]] · [[retry-with-backoff]] · [[model-gateway]]
