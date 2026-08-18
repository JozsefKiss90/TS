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

A `.d.ts` file that states a package's types and documented defaults, with no implementation. For a
generated SDK the declaration files are the authoritative description of its surface. In this SDK,
`client.d.ts` states the constructor defaults, `core/error.d.ts` the error hierarchy, and
`resources/messages/messages.d.ts` the `Message` shape and `Model` union. The compiler enforces what
they state, so read them first.

**The catch:** everything a declaration file promises is compile-time only. The rule of
[[type-erasure]] applies in full, and the `Message` type it declares still reaches you by
[[type-assertion]] over parsed bytes.

**In [[lesson-0003-the-sdk-absorbs-the-six|lesson 0003]]:** step 1 of the exercise reads the
constructor JSDoc in `node_modules/@anthropic-ai/sdk/client.d.ts` before any code is written.

**Why it matters for Hermes:** reading generated type declarations is a Phase 0 success criterion.
Every SDK Hermes wraps (Anthropic, MCP, OpenTelemetry) is understood through its declaration files
first.

**Related:** [[sdk]] · [[type-erasure]] · [[type-assertion]] · [[api-client]]
