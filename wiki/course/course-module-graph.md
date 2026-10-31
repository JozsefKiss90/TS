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
    P1["Phase 1 · Own the loop<br/>manual bounded loop · complete ✅ (0006 to 0012)"]
    P2["Phase 2 · Feed it evidence<br/>Graph RAG through MCP · complete ✅ (0013 to 0016)"]
    P3["Phase 3 · Encode the policy<br/>the workflow graph · complete ✅ (0017 to 0021)"]
    P4["Phase 4 · Prove it<br/>reliability & evaluation · open ▶ (0022–0026 shipped)"]
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
    L3["0003 The SDK Absorbs the Six Responsibilities ✅<br/>lab 02-model-client-sdk"]
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
    M10["0010 Approval Gates and Permissions ✅<br/>lab 07-tool-loop continues · three permission levels<br/>the operator is a port, and the wait races the bounds"]
    M11["0011 The Trace Is What Happened ✅<br/>lab 07-tool-loop continues · one event per decision<br/>diagnose and resume from the file alone"]
    M12["0012 Offline by Construction ✅<br/>lab 08-tested-adapters · 29 tests, no network<br/>fakes at the port, fixtures under fetch"]
    M6 -->|"failures as data → the spec that gates them"| M7
    M7 -->|"validated work enters the loop"| M8
    M8 --> M9 --> M10 --> M11 --> M12
    M6 -.->|"FakeModelGateway seeds the offline toolkit"| M12
```

Lesson maps: [[lesson-0006-the-model-gateway]] · [[lesson-0007-the-taskspec-is-a-contract]] · [[lesson-0008-tool-use-the-loops-heartbeat]] · [[lesson-0009-bounds-and-termination]] · [[lesson-0010-approval-gates-and-permissions]] · [[lesson-0011-the-trace-is-what-happened]] · [[lesson-0012-offline-by-construction]].

Supplements: 0006a has no map note, so see [[course-architecture]]. [[lesson-0006b-the-hermes-control-plane]] covers the Hermes OS control plane from the governance record. Read 0006 §1 first, then 0006b, then 0006a, then the rest.

## Phase 2, module detail

Opened 2026-09-02, complete 2026-09-30.

```mermaid
flowchart TD
    N13["0013 MCP Anatomy ✅<br/>lab 09-mcp-server · tool, resource, transport<br/>schema travels via tools/list, measured raw and by Inspector"]
    N14["0014 Evidence With Provenance ✅<br/>lab 10-graph-evidence · Zod evidence schema from PROV-DM<br/>KnowledgeGraph port, JSON-export adapter, outputSchema guard"]
    N15["0015 Test It Without an LLM ✅<br/>lab 10-graph-evidence continues · scripted client, fake behind the port<br/>in-memory transport, recorded bundles, 32 tests, no LLM"]
    N16["0016 Evidence Enters the Loop ✅<br/>lab 11-evidence-in-the-loop · S2 goes live<br/>EvidencePort, Context Pack admitted by a parse<br/>pack in the first turn, reference in the trace, 21 tests"]
    N13 -->|"the tool surface exists"| N14
    N14 -->|"the evidence shape is fixed"| N15
    N15 -->|"testable without an LLM"| N16
    N14 -.->|"knowledge graph stays apart from workflow & trace"| N16
```

Lesson maps: [[lesson-0013-mcp-anatomy]] · [[lesson-0014-evidence-with-provenance]] · [[lesson-0015-test-it-without-an-llm]] · [[lesson-0016-evidence-enters-the-loop]].

## Phase 3, module detail

Opened 2026-10-06, complete 2026-10-30. Exit met by 0020 (the loop under graph orchestration) and 0021 (the written framework decision, `docs/adr/0001-skip-langgraph-js-keep-the-port.md`).

```mermaid
flowchart TD
    Q17["0017 Thinking in State Graphs ✅<br/>lab 12-workflow-graph · 13 nodes, 26 edges, 6 guards as data<br/>strict parse, four rules · six recordings replayed, 0 model calls"]
    Q18["0018 The Loop Walks the Graph ✅<br/>lab 12 continues · seven handlers, runGraph asks the edge first<br/>typed refusal · checkpoint per step, resume measured against 0011"]
    Q19["0019 Interruption Is a State ✅<br/>lab 12 continues · a handler may park, the process exits<br/>the queue is a filter over the checkpoints · answered and resumed from other processes"]
    Q20["0020 LangGraph.js, Evaluated ✅<br/>lab 13-graph-orchestration · same graph on StateGraph behind runGraph<br/>lab 12's 74 tests unchanged · interrupt and Command measured"]
    Q21["0021 The Spec Decides the Graph ✅<br/>lab 13 continues · graphForSpec cuts what the spec rules out<br/>audit: 11 nodes, 17 edges · a hold refused on both engines · ADR 0001: skip, keep the port"]
    Q17 -->|"the graph describes the loop"| Q18
    Q18 -->|"the graph drives the loop"| Q19
    Q19 -->|"persistence and interruption by hand"| Q20
    Q20 -->|"the framework, measured"| Q21
    Q17 -.->|"the graph holds no claims and no events"| Q21
```

Lesson maps: [[lesson-0017-thinking-in-state-graphs]] · [[lesson-0018-the-loop-walks-the-graph]] · [[lesson-0019-interruption-is-a-state]] · [[lesson-0020-langgraph-js-evaluated]] · [[lesson-0021-the-spec-decides-the-graph]].

## Phase 4, module detail

Opened 2026-10-30. Shipped rows are history. The next row is firm, and the rest are provisional, per [ROADMAP.md](../../ROADMAP.md).

```mermaid
flowchart TD
    R22["0022 What the Run Cost ✅<br/>lab 14-reliability · costReport pairs trace lines into spans<br/>sums equal job_ended on all seven runs · alert placed at a call"]
    R23["0023 OpenTelemetry, Evaluated ✅<br/>lab 15 · the same spans through a library, read back equal<br/>ADR 0002 · OTLP adopted as the export format"]
    R24["0024 Landing the Outputs ✅<br/>lab 14 · one artifact per run, linked to its trace and cost<br/>computed from the trace file · a crashed run lands failed"]
    R25["0025 Golden Tasks ✅<br/>lab 16-benchmark · four stored tasks, five named graders<br/>real loop 13 of 13 · each planted defect fails one task"]
    R26["0026 Many Runs, One Verdict ✅<br/>seeded fake · pass rate and pass^k<br/>4,000 trials at a set 10% · reruns by seed"]
    R27["0027 The Regression Gate ✅<br/>benchmark-v1 hashed · baseline by seed and grader<br/>four defects refused · ADR 0003: ten clean runs + signature"]
    R22 -->|"hand-computed spans to compare against"| R23
    R22 -->|"the cost report each artifact links to"| R24
    R24 -->|"an addressable artifact to grade"| R25
    R25 --> R26
    R26 --> R27
```

Lesson maps: [[lesson-0022-what-the-run-cost]] · [[lesson-0023-opentelemetry-evaluated]] · [[lesson-0024-landing-the-outputs]] · [[lesson-0025-golden-tasks]] · [[lesson-0026-many-runs-one-verdict]] · [[lesson-0027-the-regression-gate]].

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
        TLOOP["tool loop ✅ 0008<br/>bounds ✅ 0009 · gates ✅ 0010"]
        TR["trace ✅ 0011"]
        TESTS["offline suite ✅ 0012<br/>fakes + fixtures"]
    end
    MOCK --> GWY
    SIX --> GWY
    ZOD --> SPEC
    SPEC --> TLOOP
    GWY --> TLOOP
    TLOOP --> TR
    TLOOP --> TESTS
    EV["MCP evidence tools ✅ Phase 2<br/>surface 0013 · provenance 0014 · offline tests 0015"] -->|"EvidencePort ✅ 0016"| PACK["Context Pack ✅ 0016<br/>admitted, or no dispatch"]
    PACK -->|"first turn"| TLOOP
    TLOOP --> WG["workflow graph ✅ 0017<br/>as data, replayed against the trace<br/>drives the loop ✅ 0018 · checkpoint per step<br/>a held call parks ✅ 0019 · the queue is the parked checkpoints<br/>run on LangGraph.js behind the same port ✅ 0020<br/>one job graph per spec ✅ 0021 · framework skipped, port kept"]
    TR -->|"recordings replayed"| WG
    TR -->|"lines paired into spans"| COST["cost report ✅ 0022<br/>time, tokens, dollars per step<br/>sums checked against job_ended"]
    COST -->|"emitted, read back equal"| OTLP["OTLP export ✅ 0023<br/>computed after the run · ADR 0002<br/>the trace stays the record"]
    TR -->|"read after every run"| LAND["artifacts ✅ 0024<br/>one folder per run · output + status<br/>links to the trace and the cost report"]
    LAND -->|"read by graders"| SCORE["scorecard ✅ 0025<br/>golden tasks · named graders<br/>graders never import the loop"]
    COST -->|"written beside it"| LAND
    TR --> SCORE
    SCORE -->|"n trials per task"| TRIALS["trials ✅ 0026<br/>seeded fake · pass rate · pass^k<br/>a failed trial reruns from its seed"]
    TESTS --> GATE["regression gate ✅ 0027<br/>benchmark-v1 frozen by hash · ADR 0003<br/>baseline moves only by promotion"]
    TRIALS --> GATE
    GATE -->|"gates"| P5P6["Phases 5–6 decisions"]
```

Scenario steps these feed (see [[hermes-integration]]):

| Step | Where the course builds it |
|---|---|
| S1 (the envelope check) | Phase 0's boundary parse, then Phase 1's TaskSpec |
| S2 (evidence assembled) | Phase 2, over MCP — served since lesson 0013, with provenance since 0014. A client reads it under test since 0015. The loop plans from an admitted Context Pack since 0016 |
| S3 (dispatch under the graph) | Phase 3. The graph exists as data since lesson 0017 and drives the loop since 0018. A move it lacks is refused before it happens, and a checkpoint is written per step. Since 0019 a run can stand at a node with no process behind it. Since 0020 LangGraph.js can run it behind the same signature, with the guards still asked by Hermes's code. Since 0021 each job runs under a graph built from its spec, and ADR 0001 keeps lab 12's interpreter as the engine |
| S4 (model calls) | Phase 0's mechanics, below Phase 1's port |
| S5 (the loop iterates) | Phase 1, from lesson 0008, with the approval gate since lesson 0010. Since lesson 0019 a held call parks the run, and the queue is the checkpoints at `awaiting_approval`, answered from any process |
| S6 (budget enforcement) | Phase 0's cancellation, enforced by lesson 0009's bounds. Since lesson 0022 the 80% alert is placed at the call that crossed it, read back from the trace |
| S7 (the durable record) | Phase 1 since lesson 0011, deepened in Phase 4. Lesson 0018's checkpoint is a separate record under S3, not part of the trace. Since lesson 0022 a cost report is computed from the trace and checked against it, a view and never a second record. Since lesson 0023 the same spans export as OTLP, read back equal, with new ids on every export (ADR 0002) |
| S8 (landing the outputs) | Phase 4. Since lesson 0024 every run lands one folder under `artifacts/<run>/`, computed from its trace file. It holds the output, a status of done or failed, and links to the trace and the cost report. A crashed run lands failed, and a parked run lands when it ends |
| S9 (scoring the run) | Phase 4. Since lesson 0025 four golden tasks run offline through any loop with `startJob`'s shape. Five graders read only the landed artifact, the trace and the task, and a scorecard records every grade. Since lesson 0026 each task runs n times on a seeded fake, and `trials.json` reports pass rate and pass^k; a failed trial reruns from its seed. Since lesson 0027 a committed baseline for `benchmark-v1` refuses any trial failure it does not list, and moves only after ten clean runs and an accepted ADR (ADR 0003) |
