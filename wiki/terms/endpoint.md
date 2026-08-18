---
term: Endpoint
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

# Endpoint

The URL plus method a request targets. For the [[messages-api]] it is `POST https://api.anthropic.com/v1/messages`. Raw `fetch` spells it out. The [[sdk]] holds it inside the client, so you never type it.

**First seen in [[lesson-0001-trace-one-request|lesson 0001]]** as responsibility ①. **In [[lesson-0002-raw-http-against-a-mock|lesson 0002]]:** the lab points the same request at a local mock by swapping the [[base-url]].

*Demoted to ordinary vocabulary on 2026-08-17: lessons use this word without a definition. The note stays as a reference.*

**Related:** [[api]] · [[messages-api]] · [[sdk]] · [[base-url]]
