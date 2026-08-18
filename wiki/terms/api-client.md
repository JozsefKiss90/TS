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

An object that holds an API's connection settings and exposes the API's operations as typed methods.
The settings are the [[base-url]], the credentials, the retry count, and the timeout. Construction is
configuration. Calls are use. Exercise 01 scattered those settings across one function. The client
gathers them into one place, and every call inherits them unless a [[request-options]] bag overrides
them.

**In [[lesson-0003-the-sdk-absorbs-the-six|lesson 0003]]:** `new Anthropic({ baseURL, apiKey })`,
with the environment fallbacks (`ANTHROPIC_BASE_URL`, `ANTHROPIC_API_KEY`) read from the
constructor's JSDoc in the [[declaration-file]].

**Why it matters for Hermes:** lesson 0006's `AnthropicModelGateway` holds one client and adds what
the client does not have: budgets, approval, runtime validation. The client is mechanics. The
[[model-gateway]] is policy.

**Related:** [[sdk]] · [[base-url]] · [[api-key-authentication]] · [[request-options]] · [[retry-with-backoff]] · [[model-gateway]]
