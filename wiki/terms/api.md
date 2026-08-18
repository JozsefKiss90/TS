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

The set of rules a server enforces on the wire. The rules name the [[endpoint]], the required headers, the [[request-and-response-shape|request and response shape]], and the meaning of each status code. The headers include the [[api-key-authentication|API key]] and the [[api-version-header|version header]]. The same rules bind TypeScript, Python, Rust, and curl.

**In [[lesson-0001-trace-one-request|lesson 0001]]:** the raw `fetch` call to the [[messages-api]] shows every rule with nothing hidden. Every header, field, and error branch is written by hand.

**Why it matters for Hermes:** every loop Hermes runs ends in API requests. Debugging a hung run requires knowing which behavior is an API rule and which is an [[sdk]] choice.

**Related:** [[sdk]] · [[endpoint]] · [[messages-api]] · [[request-and-response-shape]] · [[stop-reason]]
