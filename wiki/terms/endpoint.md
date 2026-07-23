---
term: Endpoint
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

# Endpoint

The URL-plus-method a request targets — for the [[messages-api]], `POST https://api.anthropic.com/v1/messages`. Part of the [[api]] contract: raw `fetch` spells it out; the [[sdk]] bakes it into the client so you never type it.

**In [[lesson-0001-trace-one-request|lesson 0001]]:** responsibility ① of the six — visible in the `fetch` version, absorbed by `new Anthropic()` in the SDK version.

**Related:** [[api]] · [[messages-api]] · [[sdk]]
