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

One HTTP request written twice, raw `fetch` and `@anthropic-ai/sdk`. The lesson separates the API's rules from the library's chores. Material: [open the lesson](../../lessons/0001-trace-one-request-api-vs-sdk.html).

## The two layers

```mermaid
flowchart LR
    subgraph APIL["API rules, on the wire"]
        EP["① endpoint<br/>POST /v1/messages"]
        AU["② x-api-key header"]
        VH["③ anthropic-version header"]
        RC["④ required body fields<br/>model · max_tokens · messages"]
        SR["stop_reason and content blocks<br/>in the response"]
    end
    subgraph SDKL["SDK layer, the chores"]
        KEY["env-var key lookup"]
        RT["⑤ typed errors ·<br/>retries · timeout"]
        CX["⑥ signal passed<br/>to the transport"]
        TY["response described by<br/>TypeScript types"]
    end
    SDKL -- "same bytes on the wire" --> APIL
    TY -. "erased at runtime.<br/>Runtime validation is a separate job" .-> SR
```

## The six responsibilities on one request

```mermaid
sequenceDiagram
    participant Code as Your code
    participant SDK as SDK layer
    participant API as api.anthropic.com
    Code->>SDK: client.messages.create(params, { signal })
    Note over SDK: ② resolve key · ③ version header<br/>④ body checked at compile time
    SDK->>API: ① POST /v1/messages
    API-->>SDK: 429 rate limited
    Note over SDK: ⑤ typed error. Back off, then retry
    SDK->>API: retry
    API-->>SDK: 200 + JSON bytes
    Note over SDK: parse the JSON, assert the type. No runtime check
    SDK-->>Code: typed Message
    Note over Code: ⑥ controller.abort() cancels at any point
```

## Terms

Registered to this lesson: [[api]] · [[sdk]] · [[request-and-response-shape]] · [[type-assertion]] · [[type-erasure]] · [[runtime-validation]]

## What the 2026-08-16 rewrite changed

- The lesson went from 21 lint errors to 0 under `docs/style/ste-profile.md`.
- *Contract* left the lesson, and responsibility ④ is now the request and response shape.
- The note `request-contract.md` was renamed to `request-and-response-shape.md`, per the 2026-08-08 ruling.
- A fourth quiz question was added, per the Article V calibration.
- Eleven of the original seventeen term notes moved to the lessons that exercise them.

| New home | Notes moved |
|---|---|
| lesson 0002 | [[endpoint]] · [[api-key-authentication]] · [[messages-api]] · [[stop-reason]] |
| lesson 0003 | [[api-version-header]] · [[error-boundary]] · [[retry-with-backoff]] · [[cancellation]] · [[narrowing]] |
| lesson 0005 | [[discriminated-union]] |
| lesson 0006 | [[model-gateway]] |

```dataview
TABLE term AS Term, category AS Category, status AS Status
FROM "wiki/terms"
WHERE type = "glossary-term" AND lesson = "0001"
SORT category ASC, term ASC
```
