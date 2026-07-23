---
term: API version header
aliases:
  - anthropic-version
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

# API version header

The mandatory `anthropic-version` request header that pins which revision of the wire contract the server should honor, so responses don't change shape under your feet. Demanded by the [[api]] from every language; the [[sdk]] attaches it silently.

**In [[lesson-0001-trace-one-request|lesson 0001]]:** responsibility ③ of the six, and the answer to quiz Q3 — the one item in the list that is API semantics rather than SDK convenience.

**Related:** [[api]] · [[request-contract]] · [[sdk]]
