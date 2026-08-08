---
term: Fake
aliases:
  - FakeModelGateway
  - in-process test double
type: glossary-term
lesson: "0006"
phase: 1
category: hermes
status: introduced
introduced: 2026-07-29
tags:
  - glossary
  - hermes
---

# Fake

A [[test-double]] that is a **real, working implementation** of a [[port]] — just a trivial one: it answers from a script and records what the domain asked. Distinguish by altitude: the mock server (lesson 0002) doubles the API *at the wire* — a real HTTP process on port 8787; a fake doubles the dependency *at the port* — in-process, no socket, no latency. The code under test cannot tell either from the real thing.

**In [[lesson-0006-the-model-gateway|lesson 0006]]:** `FakeModelGateway` implements `ModelGateway` from a scripted `GatewayResult[]`, honors the port's whole contract (including `AbortSignal`), and exposes `calls` for assertions. Measured: with the mock **stopped**, the same supervisor ran a two-call scenario — including the throttle-policy branch — in 0.6 ms.

**Why it matters for Hermes:** Phase 1's exit criterion is a loop *testable offline with fakes and recorded fixtures*; the fake is how policy tests shed the network entirely. It is also the port's second implementation — the thing that keeps the provider-neutral contract honest with only one live [[adapter]].

**Related:** [[test-double]] · [[port]] · [[adapter]] · [[model-gateway]] · [[cancellation]]
