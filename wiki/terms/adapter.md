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

A class that `implements` a [[port]] by translating between the domain's vocabulary and one concrete dependency's. The adapter is where the outside technology is *openly* used — nothing is hidden — but its types, exceptions, and spellings stop there; "below the port" describes the import graph, not secrecy.

**In [[lesson-0006-the-model-gateway|lesson 0006]]:** `AnthropicModelGateway` performs three translations: ⑴ `ModelCall` → the [[sdk]]'s request params (the wire stays byte-for-byte lesson 0002's exchange — an adapter adds zero bytes); ⑵ the SDK's `Message` → boundary-parsed via [[safe-parse]] → `ModelReply` (lesson 0005's check finds its permanent home here); ⑶ the SDK's [[typed-error]] classes → `GatewayFailure` **data** — measured: `RateLimitError` crossed the port as `{ kind: "throttled", retryAfterMs: 5000 }`. Unrecognized errors are rethrown: bugs must stay loud.

**Why it matters for Hermes:** S4's "below the port" half — the six responsibilities keep running unchanged inside the wrapped client, and the supervisor receives typed failures it can classify instead of exceptions that unwind its stack.

**Related:** [[port]] · [[fake]] · [[model-gateway]] · [[typed-error]] · [[safe-parse]] · [[sdk]]
