---
term: Request options
aliases:
  - options bag
  - per-request overrides
type: glossary-term
lesson: "0003"
phase: 0
category: sdk-layer
status: demonstrated
introduced: 2026-07-24
demonstrated: 2026-07-27
tags:
  - glossary
  - sdk-layer
---

# Request options

The second argument to an SDK method: a bag of per-call transport settings (`headers`, `timeout`,
`maxRetries`, `signal`), kept separate from the request params. Params say what you are asking.
Options say how this one call behaves on the wire. Options never appear in the request body.

**In [[lesson-0003-the-sdk-absorbs-the-six|lesson 0003]]:** `client.messages.create(params,
{ headers: { "x-mock-scenario": "rate-limit" }, maxRetries: 0, signal: controller.signal })` drives
every errors (⑤) and cancellation (⑥) experiment against the mock.

**Why it matters for Hermes:** per-call policy, such as a deadline or the cancellation of one
attempt, maps onto request options. Durable policy lives on the [[api-client]]. Knowing which knob
lives at which level is what makes a [[model-gateway]] implementable.

**Related:** [[api-client]] · [[cancellation]] · [[typed-error]] · [[retry-with-backoff]]
