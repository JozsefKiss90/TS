---
term: Messages API
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

# Messages API

Anthropic's model API. One call to `POST /v1/messages` sends `model`, `max_tokens`, and `messages`. The reply's `content` is an array of typed blocks, plus a [[stop-reason]]. The block array is a wire-level [[discriminated-union]].

**First seen in [[lesson-0001-trace-one-request|lesson 0001]]:** both snippets call it, once raw and once through the [[sdk]]. **In [[lesson-0002-raw-http-against-a-mock|lesson 0002]]:** the lab replays it against a local mock.

**Reference:** [Messages API docs](https://platform.claude.com/docs/en/api/messages)

*Demoted to ordinary vocabulary on 2026-08-17: the name is a proper noun, used without a definition. The note stays as a reference.*

**Related:** [[endpoint]] · [[request-and-response-shape]] · [[stop-reason]] · [[discriminated-union]]
