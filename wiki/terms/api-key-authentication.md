---
term: API-key authentication
aliases:
  - authentication
  - x-api-key
type: glossary-term
lesson: ""
phase: 0
category: protocol
status: introduced
introduced: 2026-07-23
tags:
  - glossary
  - protocol
---

# API-key authentication

Proving identity to the [[api]] by sending a secret key in the `x-api-key` header. The header is an API rule. Where the key comes from is client convenience, and the [[sdk]] reads `ANTHROPIC_API_KEY` for you.

**First seen in [[lesson-0001-trace-one-request|lesson 0001]]** as responsibility ②, and as the classification trap: the environment-variable lookup belongs to the SDK layer. **In [[lesson-0002-raw-http-against-a-mock|lesson 0002]]:** the lab sends the header by hand.

**Why it matters for Hermes:** a Claude subscription does not supply API credentials. The auth and billing route must be confirmed before any live-call exercise.

*Demoted to ordinary vocabulary on 2026-08-17: lessons use this phrase without a definition. The note stays as a reference.*

**Related:** [[api]] · [[sdk]] · [[api-version-header]]
