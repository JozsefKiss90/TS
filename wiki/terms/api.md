---
term: API
aliases:
  - Application Programming Interface
type: glossary-term
lesson: "0001"
phase: 0
category: protocol
status: demonstrated
introduced: 2026-07-23
demonstrated: 2026-07-23
tags:
  - glossary
  - protocol
---

# API

The contract that lives **on the wire**: which [[endpoint]] to call, which headers are mandatory ([[api-key-authentication]], [[api-version-header]]), which body fields are required ([[request-contract]]), and what the response and its status codes mean. The same rules apply from TypeScript, Python, Rust, or curl — the contract belongs to no language.

**In [[lesson-0001-trace-one-request|lesson 0001]]:** the raw `fetch` call to the [[messages-api]] shows the contract with nothing hidden — every header, field, and error branch written by hand.

**Why it matters for Hermes:** every loop Hermes runs bottoms out in API requests. Debugging a hung run or bounding a loop requires knowing which behavior is the contract and which is an [[sdk]] choice.

**Related:** [[sdk]] · [[endpoint]] · [[messages-api]] · [[request-contract]] · [[stop-reason]]
