---
type: lesson-map
title: Trace One Request Through an API and a TypeScript SDK
lesson: "0001"
phase: 0
date: 2026-07-23
material: lessons/0001-trace-one-request-api-vs-sdk.html
tags:
  - lesson-map
---

# Lesson 0001 — Trace One Request Through an API and a TypeScript SDK

One HTTP request written twice — raw `fetch` and `@anthropic-ai/sdk` — to separate what belongs to the wire contract from what the library does for you. Material: [open the lesson](../../lessons/0001-trace-one-request-api-vs-sdk.html).

## The two layers

```mermaid
flowchart LR
    subgraph APIL["API semantics — the wire contract"]
        EP["① endpoint<br/>POST /v1/messages"]
        AU["② x-api-key header"]
        VH["③ anthropic-version header"]
        RC["④ required body fields<br/>model · max_tokens · messages"]
        SR["stop_reason & content blocks<br/>in the response"]
    end
    subgraph SDKL["SDK layer — the chores"]
        KEY["env-var key lookup"]
        RT["⑤ typed errors ·<br/>retries · timeout"]
        CX["⑥ signal plumbed<br/>to the transport"]
        TY["response described by<br/>TypeScript types"]
    end
    SDKL -- "same bytes on the wire" --> APIL
    TY -. "erased at runtime —<br/>runtime validation is a separate job" .-> SR
```

## The six responsibilities on one request

```mermaid
sequenceDiagram
    participant Code as Your code
    participant SDK as SDK layer
    participant API as api.anthropic.com
    Code->>SDK: client.messages.create(params, { signal })
    Note over SDK: ② resolve key · ③ version header<br/>④ compile-time-checked body
    SDK->>API: ① POST /v1/messages
    API-->>SDK: 429 rate limited
    Note over SDK: ⑤ typed error → back off, retry
    SDK->>API: retry
    API-->>SDK: 200 + JSON bytes
    Note over SDK: parse + assert types (no runtime check)
    SDK-->>Code: typed Message
    Note over Code: ⑥ controller.abort() cancels at any point
```

## Terms introduced

[[api]] · [[sdk]] · [[endpoint]] · [[api-key-authentication]] · [[api-version-header]] · [[request-contract]] · [[messages-api]] · [[stop-reason]] · [[error-boundary]] · [[retry-with-backoff]] · [[cancellation]] · [[type-erasure]] · [[type-assertion]] · [[narrowing]] · [[discriminated-union]] · [[runtime-validation]] · [[model-gateway]]

```dataview
TABLE term AS Term, category AS Category, status AS Status
FROM "wiki/terms"
WHERE type = "glossary-term" AND lesson = "0001"
SORT category ASC, term ASC
```
