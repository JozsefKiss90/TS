---
term: Adapter
type: glossary-term
lesson: "0006"
phase: 1
category: hermes
status: introduced
introduced: 2026-07-29
tags:
  - glossary
  - hermes
---

# Adapter

A class that `implements` a [[port]] by translating between the domain's vocabulary and one concrete dependency's. The adapter uses the outside technology openly, and nothing about it is hidden. Its types, exceptions and spellings stop there. "Below the port" describes the import graph, not secrecy.

**In [[lesson-0006-the-model-gateway|lesson 0006]]:** `AnthropicModelGateway` translates three things.

1. `ModelCall` becomes the [[sdk]]'s request params. The wire stays byte for byte what lesson 0002 produced, because an adapter adds no bytes.
2. The SDK's `Message` passes through [[safe-parse]] and becomes a `ModelReply`. Lesson 0005's check found its permanent home here.
3. The SDK's [[typed-error]] classes become `GatewayFailure` data. Measured: `RateLimitError` crossed the port as `{ kind: "throttled", retryAfterMs: 5000 }`.

The adapter rethrows any error it cannot classify, because a bug must reach the caller.

**Why it matters for Hermes:** this is the "below the port" half of S4 (model calls). The six responsibilities keep running unchanged inside the wrapped client. The supervisor receives failures it can classify, instead of exceptions that unwind its stack.

**Related:** [[port]] · [[fake]] · [[model-gateway]] · [[typed-error]] · [[safe-parse]] · [[sdk]]
