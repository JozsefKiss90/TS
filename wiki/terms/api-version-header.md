---
term: API version header
aliases:
  - anthropic-version
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

# API version header

The mandatory `anthropic-version` request header. It pins one revision of the [[api]]'s rules, so response shapes do not change under a deployed client. Every language must send it. The [[sdk]] attaches it silently.

**First seen in [[lesson-0001-trace-one-request|lesson 0001]]** as responsibility ③. **In [[lesson-0003-the-sdk-absorbs-the-six|lesson 0003]]:** one of the chores the SDK absorbs, and the reason the SDK can trust its own generated types.

*Demoted to ordinary vocabulary on 2026-08-18: lessons use this phrase without a definition. The note stays as a reference.*

**Related:** [[api]] · [[request-and-response-shape]] · [[sdk]]
