---
term: Base URL
aliases:
  - baseURL
  - ANTHROPIC_BASE_URL
type: glossary-term
lesson: "0002"
phase: 0
category: sdk-layer
status: introduced
introduced: 2026-07-23
tags:
  - glossary
  - sdk-layer
---

# Base URL

The host and scheme half of an [[endpoint]], treated as configuration. The API fixes the path, `/v1/messages`. A client lets you override where the request points. The official SDK exposes this as the `baseURL` option, or as the `ANTHROPIC_BASE_URL` environment variable.

**In [[lesson-0002-raw-http-against-a-mock|lesson 0002]]:** `client.ts` reads `ANTHROPIC_BASE_URL` and falls back to `http://localhost:8787`, the [[test-double]]. The same option aims the real `@anthropic-ai/sdk` at the mock in exercise 02, with no change to SDK code.

**Why it matters for Hermes:** a configuration point the caller controls is what makes a system testable. The base URL is the first one in the course. Hermes' [[model-gateway]] interface is the same idea one level up. It swaps the real dependency for a fake at a boundary the domain owns.

**Related:** [[endpoint]] · [[test-double]] · [[sdk]] · [[model-gateway]]
