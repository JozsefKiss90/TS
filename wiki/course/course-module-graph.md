---
type: course-doc
doc: module-graph
title: Module Graphs
date: 2026-07-25
normative: false
tags:
  - course
---

# Module graphs

Graph form of [ROADMAP.md](../../ROADMAP.md): the phases, their gates, and the lesson modules inside the open phase. **Sync duty:** when a lesson ships or a phase opens, update ROADMAP.md *and* this note in the same session. The roadmap's firmness gradient applies here too: shipped = history, next lesson = firm, everything further = provisional.

## The phase graph (gates are edges)

```mermaid
flowchart TD
    P0["Phase 0 · See the wire<br/>TS/SDK literacy · complete ✅"]
    P1["Phase 1 · Own the loop<br/>manual bounded loop · 0006 to 0009 ✅ · next: 0010 ▶"]
    P2["Phase 2 · Feed it evidence<br/>Graph RAG through MCP"]
    P3["Phase 3 · Encode the policy<br/>the workflow graph"]
    P4["Phase 4 · Prove it<br/>reliability & evaluation"]
    P5["Phase 5 · Meet the harness<br/>Claude Agent SDK"]
    P6["Phase 6 · Scale the agents<br/>multi-agent"]
    P0 -->|"0005 ships: every boundary runtime-validated"| P1
    P1 -->|"loop runs offline with fakes & fixtures"| P2
    P2 -->|"evidence consumed through MCP, no LLM needed to test"| P3
    P3 -->|"loop under graph orchestration + written framework justification"| P4
    P4 -->|"traces, golden tasks, regression gates exist"| P5
    P5 -->|"⛔ HARD GATE: benchmark shows single-agent CEILING, not tuning"| P6
```

## Phase 0, module detail

```mermaid
flowchart TD
    L1["0001 Trace One Request ✅<br/>the six responsibilities"]
    L2["0002 Raw HTTP Against a Mock ✅<br/>lab 01-raw-http"]
    L3["0003 The SDK Absorbs the Six ✅<br/>lab 02-model-client-sdk"]
    L4["0004 The Response Becomes a Process ✅<br/>lab 03-streaming-and-cancellation"]
    L5["0005 Validate the Boundary ✅<br/>lab 04-validate-the-boundary"]
    L1 -->|"do the six by hand"| L2
    L2 -->|"same mock, SDK absorbs mechanics"| L3
    L3 -->|"stream: true — response becomes a process"| L4
    L4 -->|"the assertion becomes a checked parse"| L5
    L1 -.->|"§3 debt: types are compile-time claims"| L5
```

Lesson maps: [[lesson-0001-trace-one-request]] · [[lesson-0002-raw-http-against-a-mock]] · [[lesson-0003-the-sdk-absorbs-the-six]] · [[lesson-0004-the-response-becomes-a-process]] · [[lesson-0005-validate-the-boundary]]

## Phase 1, module detail

```mermaid
flowchart TD
    M6["0006 The Model Gateway ✅<br/>lab 05-model-gateway · port + adapter + fake<br/>provider decision: neutral port, one live adapter"]
    M7["0007 The TaskSpec Is a Contract ✅<br/>lab 06-taskspec · schema for the work<br/>admissibility check: no spec, no dispatch"]
    M8["0008 Tool Use, the Loop's Heartbeat ✅<br/>lab 07-tool-loop · tool_use and tool_result<br/>one job becomes several model calls"]
    M9["0009 Bounds and Termination ✅<br/>lab 07-tool-loop continues · spec-owned bounds<br/>abort mid-generation, partial kept"]
    M10["0010 Approval Gates and Permissions ▶"]
    M11["0011 The Trace Is What Happened ○"]
    M12["0012 Offline by Construction ○<br/>Phase 1 capstone"]
    M6 -->|"failures as data → the spec that gates them"| M7
    M7 -->|"validated work enters the loop"| M8
    M8 --> M9 --> M10 --> M11 --> M12
    M6 -.->|"FakeModelGateway seeds the offline toolkit"| M12
```

Lesson maps: [[lesson-0006-the-model-gateway]] · [[lesson-0007-the-taskspec-is-a-contract]] · [[lesson-0008-tool-use-the-loops-heartbeat]] · [[lesson-0009-bounds-and-termination]].

Supplements: 0006a has no map note, so see [[course-architecture]]. [[lesson-0006b-the-hermes-control-plane]] covers the Hermes OS control plane from the governance record. Read 0006 §1 first, then 0006b, then 0006a, then the rest.

## What accumulates (artifacts → the loop)

Each module leaves an artifact that a later module consumes.

```mermaid
flowchart LR
    subgraph PH0["Phase 0 artifacts"]
        MOCK["mock server + fixtures"]
        SIX["the six responsibilities"]
        ZOD["Zod boundary parse"]
    end
    subgraph PH1["Phase 1 — the loop"]
        GWY["ModelGateway ✅ 0006"]
        SPEC["TaskSpec ✅ 0007"]
        TLOOP["tool loop ✅ 0008<br/>bounds ✅ 0009 · gates to come"]
        TR["trace"]
    end
    MOCK --> GWY
    SIX --> GWY
    ZOD --> SPEC
    SPEC --> TLOOP
    GWY --> TLOOP
    TLOOP --> TR
    EV["MCP evidence tools — Phase 2"] --> TLOOP
    TLOOP --> WG["workflow graph — Phase 3"]
    TR --> EVAL["golden tasks + evals — Phase 4"]
    EVAL -->|"gates"| P5P6["Phases 5–6 decisions"]
```

Scenario steps these feed (see [[hermes-integration]]):

| Step | Where the course builds it |
|---|---|
| S1 (the envelope check) | Phase 0's boundary parse, then Phase 1's TaskSpec |
| S2 (evidence assembled) | Phase 2, over MCP |
| S3 (dispatch under the graph) | Phase 3 |
| S4 (model calls) | Phase 0's mechanics, below Phase 1's port |
| S5 (the loop iterates) | Phase 1, from lesson 0008 |
| S6 (budget enforcement) | Phase 0's cancellation, enforced by lesson 0009's bounds |
| S7 (the durable record) | Phase 1 and Phase 4 |
| S8 (landing the outputs) | Phase 4 |
| S9 (scoring the run) | Phase 4 |
