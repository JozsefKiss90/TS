---
term: Composition root
aliases:
  - wiring
  - static composition
type: glossary-term
lesson: "0006a"
phase: 1
category: hermes
status: introduced
introduced: 2026-07-29
tags:
  - glossary
  - hermes
---

# Composition root

The one place in a program that **knows concrete classes exist and bolts them together** — constructing clients and adapters, choosing their configuration, and handing the finished objects to the code that uses them through a [[port]]. Everything it does is **wiring**: deciding *which object exists*, never *what a result means* (that is [[hermes-policy]]). After construction it takes no further part in any call.

**In supplement [0006a](../../lessons/0006a-hermes-architecture-primer.html):** `main.ts` is exercise 05's composition root — `new Anthropic({ baseURL, apiKey })`, `new AnthropicModelGateway(client, MODEL)`, and the choice of live [[adapter]] versus [[fake]] all happen there. The fixed `const MODEL = "claude-opus-4-8"` is the canonical non-example of policy: a constant is configuration, not a decision rule. Injecting it does the real architectural work — the adapter cannot own model selection, so the decision point waits above the port for a future [[routing-policy]].

**Why it matters for Hermes:** wiring is where provider-shaped knowledge is allowed to live above the adapter — endpoint, key, retry count, scenario headers — precisely so the supervisor never sees any of it (S4).

**Related:** [[port]] · [[adapter]] · [[fake]] · [[dependency-inversion]] · [[hermes-policy]] · [[routing-policy]] · [[base-url]]
