---
term: SDK
aliases:
  - Software Development Kit
  - client SDK
type: glossary-term
lesson: "0001"
phase: 0
category: sdk-layer
status: demonstrated
introduced: 2026-07-23
demonstrated: 2026-07-23
tags:
  - glossary
  - sdk-layer
---

# SDK

A language-specific library that performs an [[api]]'s chores for you: resolves credentials, attaches mandatory headers, retries transient failures ([[retry-with-backoff]]), applies timeouts, raises typed errors ([[error-boundary]]), plumbs [[cancellation]], and describes requests and responses with types. Nothing changes on the wire — what changes is **who does the chores**.

**In [[lesson-0001-trace-one-request|lesson 0001]]:** `@anthropic-ai/sdk` absorbs all six responsibilities of the raw `fetch` version; the exercise is pointing at each line and saying whether the wire contract or the library owns it.

**Why it matters for Hermes:** an SDK you can't see through is magic, and Hermes is not allowed to depend on magic. Its response types are compile-time claims, not runtime checks ([[type-erasure]]) — which is why the [[model-gateway]] boundary and [[runtime-validation]] exist.

**Related:** [[api]] · [[retry-with-backoff]] · [[error-boundary]] · [[cancellation]] · [[type-erasure]] · [[model-gateway]]
