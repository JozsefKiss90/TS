---
term: API-key authentication
aliases:
  - authentication
  - x-api-key
type: glossary-term
lesson: "0001"
phase: 0
category: protocol
status: introduced
introduced: 2026-07-23
tags:
  - glossary
  - protocol
---

# API-key authentication

Proving identity to the [[api]] by sending a secret key in the `x-api-key` header. The header itself is wire contract; **where the key comes from** — the `ANTHROPIC_API_KEY` environment-variable lookup — is [[sdk]] convenience layered on top.

**In [[lesson-0001-trace-one-request|lesson 0001]]:** responsibility ② of the six. The classification exercise's trap item: "the key is read from the environment variable" belongs to the SDK layer, not the contract.

**Why it matters for Hermes:** a Claude subscription does **not** supply API credentials — the auth/billing route must be confirmed before any live-call exercise (see NOTES.md decisions).

**Related:** [[api]] · [[sdk]] · [[api-version-header]]
