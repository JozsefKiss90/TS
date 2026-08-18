---
type: lesson-map
title: The SDK Absorbs the Six Responsibilities
lesson: "0003"
phase: 0
date: 2026-07-24
material: lessons/0003-the-sdk-absorbs-the-six.html
lab: hermes-sdk-lab/02-model-client-sdk
tags:
  - lesson-map
---

# Lesson 0003 — The SDK Absorbs the Six Responsibilities

Exercise 01's raw request, rewritten with the official `@anthropic-ai/sdk` and aimed at the same
[[test-double]] through the [[base-url]] option. Each of the six responsibilities becomes a
constructor option, a typed parameter, or automatic behavior. The mock cannot tell the two clients
apart, which is the definition of an [[sdk]] made observable.
Material: [open the lesson](../../lessons/0003-the-sdk-absorbs-the-six.html) · lab:
`hermes-sdk-lab/02-model-client-sdk/`.

## The six responsibilities, absorbed into a layer

```mermaid
flowchart TD
    CALL["your code:<br/>client.messages.create(params)"]
    subgraph SDK["@anthropic-ai/sdk"]
        EP["① path + baseURL"]
        AUTH["② x-api-key from apiKey or env"]
        VER["③ anthropic-version header"]
        SER["④ serialize, parse, assert Message"]
        ERR["⑤ typed errors, retries obey retry-after"]
        CAN["⑥ signal and timeout plumbing"]
    end
    WIRE["the wire: POST /v1/messages<br/>same body, extra SDK headers"]
    MOCK["mock-server.ts :8787<br/>unchanged, cannot tell the difference"]
    CALL --> SDK --> WIRE --> MOCK
```

Measured 2026-08-18 with a captured request: the SDK's body is byte-for-byte the raw client's 102
bytes, and the headers are a superset. The extras are the SDK's own name and telemetry, and the mock
ignores them.

## Responsibility ⑤, made visible

```mermaid
sequenceDiagram
    participant C as your code
    participant S as SDK client
    participant M as mock :8787
    C->>S: create(params, {headers: rate-limit})
    S->>M: attempt 1, POST /v1/messages
    M-->>S: 429 + retry-after: 5
    Note over S: obeys the header, waits 5 s
    S->>M: attempt 2
    M-->>S: 429 + retry-after: 5
    Note over S: waits 5 s, maxRetries (2) spent
    S->>M: attempt 3
    M-->>S: 429 + retry-after: 5
    S-->>C: throws RateLimitError (.status .type .requestID .headers)
```

Measured against the mock: three requests in the server log, 10.1 seconds of client silence, one
typed error. The raw client of exercise 01 could only print `retry-after`. The [[api-client]] obeys
it, which is [[retry-with-backoff]] implemented for you.

## What moved left, what stayed put

- A misspelled `mesages` and a missing `max_tokens` were runtime 400s in exercise 01. They are
  compile errors now, enforced by `MessageCreateParams`, the
  [[request-and-response-shape|request shape]] as a type.
- A misspelled model id still compiles, because `Model` ends in `(string & {})`. The catalog stays on
  the server.
- The response is still a [[type-assertion]] over parsed bytes, because [[type-erasure]] applies to
  declaration files too. Runtime validation is Hermes's job, paid in lesson 0005.

## Terms introduced

[[api-client]] · [[request-options]] · [[typed-error]] · [[declaration-file]] ·
[[retry-with-backoff]] · [[cancellation]]

```dataview
TABLE term AS Term, category AS Category, status AS Status
FROM "wiki/terms"
WHERE type = "glossary-term" AND lesson = "0003"
SORT category ASC, term ASC
```

## What the 2026-08-18 rewrite changed

- The lesson was rewritten to `docs/style/ste-profile.md`. Scope was kept, and the title gained the
  word "Responsibilities".
- Three notes left this lesson's registry by user decision: [[api-version-header]],
  [[error-boundary]] and [[narrowing]] are ordinary vocabulary now. Two arrivals from lesson 0001,
  [[retry-with-backoff]] and [[cancellation]], stayed and are defined in the lesson.
- The lesson gained a captured wire request, a signature table, a status table, and a version pin.
- One claim was corrected by measurement: the SDK's request body is byte-for-byte the raw client's,
  and its headers are not.
