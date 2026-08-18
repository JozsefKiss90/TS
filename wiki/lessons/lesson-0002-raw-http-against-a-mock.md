---
type: lesson-map
title: Run the Raw Request, Against a Mock
lesson: "0002"
phase: 0
date: 2026-07-23
material: lessons/0002-raw-http-against-a-mock.html
lab: hermes-sdk-lab/01-raw-http
tags:
  - lesson-map
---

# Lesson 0002 — Run the Raw Request, Against a Mock

Lesson 0001's raw `fetch` call, sent for real against a local [[test-double]] of the Messages API. The lab then breaks it six ways, so each of the six responsibilities fails in view. Material: [open the lesson](../../lessons/0002-raw-http-against-a-mock.html) · lab: `hermes-sdk-lab/01-raw-http/`.

## The mock's validation gates

```mermaid
flowchart TD
    REQ["POST /v1/messages"] --> KEY{"② x-api-key<br/>present?"}
    KEY -- no --> E401["401 authentication_error"]
    KEY -- yes --> VER{"③ anthropic-version<br/>present?"}
    VER -- no --> E400V["400 invalid_request_error"]
    VER -- yes --> CT{"content-type:<br/>application/json?"}
    CT -- no --> E400C["400 invalid_request_error"]
    CT -- yes --> RL{"x-mock-scenario:<br/>rate-limit header?"}
    RL -- yes --> E429["429 rate_limit_error<br/>+ retry-after: 5"]
    RL -- no --> BODY{"④ model · max_tokens<br/>· messages valid?"}
    BODY -- no --> E400B["400 invalid_request_error<br/>naming the field"]
    BODY -- yes --> WAIT["~400 ms simulated latency<br/>= the ⑥ abort window"]
    WAIT --> OK["200 · canned Message fixture"]
```

## The base URL, across exercises

```mermaid
flowchart LR
    subgraph EX01["exercise 01 (this lesson)"]
        C1["client.ts<br/>raw fetch"]
    end
    subgraph EX02["exercise 02 (next)"]
        C2["@anthropic-ai/sdk<br/>client.messages.create"]
    end
    subgraph LATER["much later, cost route confirmed"]
        API["api.anthropic.com"]
    end
    MOCK["mock-server.ts<br/>localhost:8787"]
    C1 -- "ANTHROPIC_BASE_URL" --> MOCK
    C2 -. "baseURL option,<br/>same configuration point" .-> MOCK
    C2 -. "default base URL" .-> API
```

The move generalizes: swap a real dependency for a [[test-double]] at a configuration point the caller controls. Phase 1's `FakeModelGateway` is this diagram one level up, with the [[model-gateway]] interface as the boundary.

## Terms introduced

[[test-double]] · [[base-url]] · [[lockfile]] · [[es-modules]] · [[strict-mode]]

```dataview
TABLE term AS Term, category AS Category, status AS Status
FROM "wiki/terms"
WHERE type = "glossary-term" AND lesson = "0002"
SORT category ASC, term ASC
```

## What the 2026-08-17 rewrite changed

- The lesson was rewritten to `docs/style/ste-profile.md`. Scope was kept.
- Four notes left this lesson's registry by user decision: [[endpoint]], [[api-key-authentication]], [[messages-api]] and [[stop-reason]] are ordinary vocabulary now.
- The lesson gained a captured wire exchange, a fourth quiz question, a status table, and a version pin.
- The count of deliberate breaks was corrected from five to six.
