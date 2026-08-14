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

A language-specific library that performs an [[api]]'s chores for you. It resolves credentials, attaches mandatory headers, retries transient failures ([[retry-with-backoff]]), and applies timeouts. It raises typed errors ([[error-boundary]]), passes [[cancellation]] through to the transport, and describes requests and responses with types. Nothing changes on the wire. What changes is who does the chores.

**In [[lesson-0001-trace-one-request|lesson 0001]]:** `@anthropic-ai/sdk` absorbs all six responsibilities of the raw `fetch` version. The exercise points at each line and asks whether the wire or the library owns it.

**Why it matters for Hermes:** Hermes cannot depend on a library whose behavior it cannot inspect. An SDK's response types are compile-time claims rather than runtime checks ([[type-erasure]]). That is why the [[model-gateway]] port and [[runtime-validation]] exist.

**Related:** [[api]] · [[retry-with-backoff]] · [[error-boundary]] · [[cancellation]] · [[type-erasure]] · [[model-gateway]]
