---
term: Messages API
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

# Messages API

Anthropic's core model [[api]]: `POST /v1/messages` takes a [[request-contract|request body]] of `model`, `max_tokens`, and `messages`, and returns a message whose `content` is an **array of blocks**, each tagged with a `type` field (a wire-level [[discriminated-union]]), plus a [[stop-reason]] saying why generation ended.

**In [[lesson-0001-trace-one-request|lesson 0001]]:** the API both snippets call — once raw, once through the [[sdk]]. The block-array response shape is server-sent JSON; the SDK merely describes it with types.

**Reference:** [Messages API docs](https://platform.claude.com/docs/en/api/messages)

**Related:** [[endpoint]] · [[request-contract]] · [[stop-reason]] · [[discriminated-union]]
