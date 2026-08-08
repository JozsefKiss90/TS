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

A stand-in that honors the same contract as a real dependency, so the code under test cannot tell the difference — and you control both sides. A double can enforce the contract's **shape** (required fields, headers, error envelopes) but never the truths behind it (genuine keys, real rate limits, the actual model catalog).

**In [[lesson-0002-raw-http-against-a-mock|lesson 0002]]:** `mock-server.ts` doubles the [[messages-api]] — it validates [[api-key-authentication]] presence, the [[api-version-header]], and the [[request-contract]], then returns a canned response with the real `Message` shape.

**Why it matters for Hermes:** mock-first is a settled curriculum decision, and this double is the ancestor of Phase 1's `FakeModelGateway` — built in lesson 0006 as a [[fake]]: the same doubling move one altitude up, at the [[port]] instead of the wire.

**Related:** [[messages-api]] · [[model-gateway]] · [[fake]] · [[base-url]] · [[request-contract]] · [[error-boundary]]
