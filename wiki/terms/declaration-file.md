---
term: Declaration file
aliases:
  - .d.ts
  - type declarations
type: glossary-term
lesson: "0003"
phase: 0
category: type-system
status: introduced
introduced: 2026-07-24
tags:
  - glossary
  - type-system
---

# Declaration file

A `.d.ts` file describes a package's types — interfaces, unions, signatures, JSDoc'd defaults — with no implementation. For a generated SDK it *is* the contract: `client.d.ts` states the constructor defaults, `core/error.d.ts` the error hierarchy, `resources/messages/messages.d.ts` the `Message` shape and the `Model` union with its `(string & {})` escape hatch. Reading declaration files beats reading docs, because they are what the compiler actually enforces.

**The catch:** everything a declaration file promises is compile-time only — [[type-erasure]] applies in full. The `Message` type it declares still reaches you by [[type-assertion]] over parsed bytes.

**In [[lesson-0003-the-sdk-absorbs-the-six|lesson 0003]]:** step 1 of the exercise is reading the constructor JSDoc in `node_modules/@anthropic-ai/sdk/client.d.ts` before writing any code.

**Why it matters for Hermes:** "reading generated type declarations and SDK source" is a Phase 0 success criterion — every SDK Hermes wraps (Anthropic, MCP, OpenTelemetry) will be understood through its declaration files first.

**Related:** [[sdk]] · [[type-erasure]] · [[type-assertion]] · [[api-client]]
