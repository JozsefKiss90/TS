---
term: Request options
aliases:
  - options bag
  - per-request overrides
type: glossary-term
lesson: "0003"
phase: 0
category: sdk-layer
status: introduced
introduced: 2026-07-24
tags:
  - glossary
  - sdk-layer
---

# Request options

The second argument to an SDK method — a bag of per-call transport overrides (`headers`, `timeout`, `maxRetries`, `signal`) kept deliberately separate from the request params. The distinction is the point: **params say what you are asking; options say how this one call should behave on the wire.** Options never appear in the request body.

**In [[lesson-0003-the-sdk-absorbs-the-six|lesson 0003]]:** `client.messages.create(params, { headers: { "x-mock-scenario": "rate-limit" }, maxRetries: 0, signal: controller.signal })` — the vehicle for every ⑤/⑥ experiment against the mock.

**Why it matters for Hermes:** the loop's per-call policy (deadline for this step, cancellation of this attempt) maps onto request options, while durable policy lives on the [[api-client]]. Knowing which knob lives at which level is what makes a [[model-gateway]] implementable.

**Related:** [[api-client]] · [[cancellation]] · [[typed-error]] · [[retry-with-backoff]]
