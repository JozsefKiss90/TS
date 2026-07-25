---
type: lesson-map
title: The SDK Absorbs the Six
lesson: "0003"
phase: 0
date: 2026-07-24
material: lessons/0003-the-sdk-absorbs-the-six.html
lab: hermes-sdk-lab/02-model-client-sdk
tags:
  - lesson-map
---

# Lesson 0003 — The SDK Absorbs the Six

Exercise 01's raw request rewritten with the official `@anthropic-ai/sdk`, aimed at the same [[test-double]] through the [[base-url]] seam. Each of the six responsibilities becomes a constructor option, a typed parameter, or automatic behavior — and the mock cannot tell the two clients apart, which is the definition of an [[sdk]] made observable. Material: [open the lesson](../../lessons/0003-the-sdk-absorbs-the-six.html) · lab: `hermes-sdk-lab/02-model-client-sdk/`.

## The six, absorbed into a layer

```mermaid
flowchart TD
    CALL["your code:<br/>client.messages.create(params)"]
    subgraph SDK["@anthropic-ai/sdk — the six, absorbed"]
        EP["① path + baseURL seam"]
        AUTH["② x-api-key from apiKey/env"]
        VER["③ anthropic-version header"]
        SER["④ serialize → parse → assert Message"]
        ERR["⑤ typed errors + retry-after honored"]
        CAN["⑥ signal + timeout plumbing"]
    end
    WIRE["the wire: POST /v1/messages —<br/>byte-for-byte exercise 01's request"]
    MOCK["mock-server.ts :8787<br/>(unchanged, cannot tell the difference)"]
    CALL --> SDK --> WIRE --> MOCK
```

## Responsibility ⑤, made visible

```mermaid
sequenceDiagram
    participant C as your code
    participant S as SDK client
    participant M as mock :8787
    C->>S: create(params, {headers: rate-limit})
    S->>M: attempt 1 — POST /v1/messages
    M-->>S: 429 + retry-after: 5
    Note over S: honors the header — waits 5 s
    S->>M: attempt 2
    M-->>S: 429 + retry-after: 5
    Note over S: waits 5 s — maxRetries (2) spent
    S->>M: attempt 3
    M-->>S: 429 + retry-after: 5
    S-->>C: throws RateLimitError (.status .type .requestID .headers)
```

Measured against the mock: 3 requests in the server log, ~10.1 s of client-side silence, one typed error. The raw client of exercise 01 could only *print* `retry-after`; the [[api-client]] obeys it — [[retry-with-backoff]], implemented for you.

## What moved left, what stayed put

- Misspelled `mesages` and missing `max_tokens`: runtime 400s in exercise 01, **compile errors** now — the [[request-contract]] enforced by `MessageCreateParams`.
- Misspelled model id: still compiles — `Model` ends in `(string & {})` so new models don't break old SDKs; the catalog is server-side truth.
- The response: the SDK's `Message` type is still a [[type-assertion]] over parsed bytes ([[type-erasure]] applies to declaration files too). Runtime validation stays Hermes's job — Zod at Phase 1's JSON boundaries.

## Terms introduced

[[api-client]] · [[request-options]] · [[typed-error]] · [[declaration-file]]

```dataview
TABLE term AS Term, category AS Category, status AS Status
FROM "wiki/terms"
WHERE type = "glossary-term" AND lesson = "0003"
SORT category ASC, term ASC
```
