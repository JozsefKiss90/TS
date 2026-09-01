---
term: Fake
aliases:
  - FakeModelGateway
  - in-process test double
type: glossary-term
lesson: "0006"
phase: 1
category: hermes
status: demonstrated
introduced: 2026-07-29
demonstrated: 2026-09-02
tags:
  - glossary
  - hermes
---

# Fake

A [[test-double]] that is a real, working implementation of a [[port]], and a trivial one. It answers from a script and records what the domain asked for.

The layer is what separates a fake from a mock server. The mock server of lesson 0002 doubles the API at the wire, as a real HTTP process on port 8787. A fake doubles the dependency at the port, in memory, with no socket and no latency. The code under test cannot tell either one from the real thing.

**In [[lesson-0006-the-model-gateway|lesson 0006]]:** `FakeModelGateway` implements `ModelGateway` from a scripted `GatewayResult[]`. It honors the whole interface, including the `AbortSignal`, and exposes `calls` for assertions. Measured: with the mock stopped, the same supervisor ran a two-call scenario in 0.6 ms, including the throttle branch.

**Why it matters for Hermes:** Phase 1's exit criterion is a loop testable offline, with fakes and recorded fixtures. The fake is how policy tests run with no network. It is also the port's second implementation, which keeps a neutral port in check while only one live [[adapter]] exists.

**Related:** [[test-double]] · [[port]] · [[adapter]] · [[model-gateway]] · [[cancellation]]
