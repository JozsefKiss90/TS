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

The host-and-scheme half of an [[endpoint]], treated as **configuration** rather than contract: the API fixes the path (`/v1/messages`) but a client lets you override where it points. The official SDK exposes this as the `baseURL` option / `ANTHROPIC_BASE_URL` environment variable.

**In [[lesson-0002-raw-http-against-a-mock|lesson 0002]]:** `client.ts` reads `ANTHROPIC_BASE_URL` and falls back to `http://localhost:8787` — the [[test-double]]. The same seam is how exercise 02 will aim the genuine `@anthropic-ai/sdk` at the mock without changing a line of SDK code.

**Why it matters for Hermes:** a deliberately designed seam is what makes a system testable. The base URL is the first of many: Hermes' [[model-gateway]] interface is the same idea one level up — swap the real dependency for a fake at a boundary you control.

**Related:** [[endpoint]] · [[test-double]] · [[sdk]] · [[model-gateway]]
