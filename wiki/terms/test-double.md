---
term: Test double
aliases:
  - mock
  - mock server
  - fake
type: glossary-term
lesson: "0002"
phase: 0
category: hermes
status: introduced
introduced: 2026-07-23
tags:
  - glossary
  - hermes
---

# Test double

A stand-in that answers the same calls as a real dependency, so the code under test cannot tell the difference. You control both sides of the exchange. A double can enforce the shape a caller must send: required fields, headers and error envelopes. It cannot enforce the truths behind that shape, such as real keys, real rate limits, or the provider's model catalog.

**In [[lesson-0002-raw-http-against-a-mock|lesson 0002]]:** `mock-server.ts` doubles the [[messages-api]]. It checks [[api-key-authentication]], the [[api-version-header]] and the [[request-and-response-shape|request and response shape]]. It then returns a canned response with the real `Message` shape.

**Why it matters for Hermes:** mock-first is a settled curriculum decision. Phase 1's `FakeModelGateway` came from this double, and lesson 0006 built it as a [[fake]]. The fake makes the same move one level up, at the [[port]] rather than at the wire.

**Related:** [[messages-api]] · [[model-gateway]] · [[fake]] · [[base-url]] · [[request-and-response-shape]] · [[error-boundary]]
