---
type: wiki-index
generated_by: tools/build-wiki-index.mjs
tags:
  - index
---

# Wiki index

Every note in this wiki, grouped by course phase. Each phase lists its lesson maps first, then the terms it introduces.

This file is generated. Run `node tools/build-wiki-index.mjs` after you add or move a note.

## Course governance

| Note | Title |
| --- | --- |
| [[COURSE]] | Course Governance & Semantics |
| [[course-spine]] | The Thematic Spine |
| [[hermes-integration]] | How the Course Becomes Hermes OS |
| [[course-module-graph]] | Module Graphs |
| [[course-architecture]] | The Control-Plane Architecture Reference |
| [[course-pedagogy]] | The Pedagogy Record |
| [[GLOSSARY]] | Glossary |

## Phase 0: TS/SDK literacy

| Lesson | Title | Lesson map |
| --- | --- | --- |
| 0001 | Trace One Request Through an API and a TypeScript SDK | [[lesson-0001-trace-one-request]] |
| 0002 | Run the Raw Request, Against a Mock | [[lesson-0002-raw-http-against-a-mock]] |
| 0003 | The SDK Absorbs the Six Responsibilities | [[lesson-0003-the-sdk-absorbs-the-six]] |
| 0004 | The Response Becomes a Process | [[lesson-0004-the-response-becomes-a-process]] |
| 0005 | Validate the Boundary | [[lesson-0005-validate-the-boundary]] |

| Term | Category | Lesson | Note |
| --- | --- | --- | --- |
| API | protocol | 0001 | [[api]] |
| API version header | protocol | 0001 | [[api-version-header]] |
| API-key authentication | protocol | 0001 | [[api-key-authentication]] |
| Endpoint | protocol | 0001 | [[endpoint]] |
| Error boundary | sdk-layer | 0001 | [[error-boundary]] |
| Messages API | protocol | 0001 | [[messages-api]] |
| Narrowing | type-system | 0001 | [[narrowing]] |
| Request and response shape | protocol | 0001 | [[request-and-response-shape]] |
| Runtime validation | validation | 0001 | [[runtime-validation]] |
| SDK | sdk-layer | 0001 | [[sdk]] |
| stop_reason | protocol | 0001 | [[stop-reason]] |
| Type assertion | type-system | 0001 | [[type-assertion]] |
| Type erasure | type-system | 0001 | [[type-erasure]] |
| Base URL | sdk-layer | 0002 | [[base-url]] |
| ES modules | sdk-layer | 0002 | [[es-modules]] |
| Lockfile | sdk-layer | 0002 | [[lockfile]] |
| Strict mode (TypeScript) | type-system | 0002 | [[strict-mode]] |
| Test double | hermes | 0002 | [[test-double]] |
| API client | sdk-layer | 0003 | [[api-client]] |
| Cancellation | sdk-layer | 0003 | [[cancellation]] |
| Declaration file | type-system | 0003 | [[declaration-file]] |
| Request options | sdk-layer | 0003 | [[request-options]] |
| Retry with exponential backoff | sdk-layer | 0003 | [[retry-with-backoff]] |
| Typed error | sdk-layer | 0003 | [[typed-error]] |
| Async iterator | type-system | 0004 | [[async-iterator]] |
| Delta | protocol | 0004 | [[delta]] |
| Message stream | sdk-layer | 0004 | [[message-stream]] |
| Server-sent events | protocol | 0004 | [[server-sent-events]] |
| Discriminated union | type-system | 0005 | [[discriminated-union]] |
| JSON boundary | validation | 0005 | [[json-boundary]] |
| Safe parse | validation | 0005 | [[safe-parse]] |
| Schema inference | type-system | 0005 | [[schema-inference]] |
| Zod schema | validation | 0005 | [[zod-schema]] |

## Phase 1: The manual bounded loop

| Lesson | Title | Lesson map |
| --- | --- | --- |
| 0006 | The Model Gateway | [[lesson-0006-the-model-gateway]] |
| 0006a | What Counts as Policy | [[lesson-0006a-what-counts-as-policy]] |
| 0006b | Supplement 0006b — The Hermes Control Plane: From Job to Evidence | [[lesson-0006b-the-hermes-control-plane]] |
| 0007 | The TaskSpec Is a Contract | [[lesson-0007-the-taskspec-is-a-contract]] |
| 0008 | Tool Use, the Loop's Heartbeat | [[lesson-0008-tool-use-the-loops-heartbeat]] |
| 0009 | Bounds and Termination | [[lesson-0009-bounds-and-termination]] |
| 0010 | Approval Gates and Permissions | [[lesson-0010-approval-gates-and-permissions]] |
| 0011 | The Trace Is What Happened | [[lesson-0011-the-trace-is-what-happened]] |
| 0012 | Offline by Construction | [[lesson-0012-offline-by-construction]] |

| Term | Category | Lesson | Note |
| --- | --- | --- | --- |
| Adapter | hermes | 0006 | [[adapter]] |
| Dependency inversion | type-system | 0006 | [[dependency-inversion]] |
| Fake | hermes | 0006 | [[fake]] |
| ModelGateway | hermes | 0006 | [[model-gateway]] |
| Port | hermes | 0006 | [[port]] |
| Composition root | hermes | 0006a | [[composition-root]] |
| Hermes policy | hermes | 0006a | [[hermes-policy]] |
| Routing policy | hermes | 0006a | [[routing-policy]] |
| Artifact Vault | hermes | 0006b | [[artifact-vault]] |
| capability gateway | hermes | 0006b | [[capability-gateway]] |
| capability routing | hermes | 0006b | [[capability-routing]] |
| Context Pack | hermes | 0006b | [[context-pack]] |
| Drift | hermes | 0006b | [[drift]] |
| Hermes job | hermes | 0006b | [[hermes-job]] |
| Job Envelope | hermes | 0006b | [[job-envelope]] |
| Job Supervisor | hermes | 0006b | [[job-supervisor]] |
| Spec-to-Evidence Loop | hermes | 0006b | [[spec-to-evidence-loop]] |
| Admissibility check | hermes | 0007 | [[admissibility-check]] |
| Refinement | validation | 0007 | [[schema-refinement]] |
| TaskSpec | hermes | 0007 | [[task-spec]] |
| tool loop | hermes | 0008 | [[tool-loop]] |
| tool_result | protocol | 0008 | [[tool-result-block]] |
| tool_use | protocol | 0008 | [[tool-use-block]] |
| partial artifact | hermes | 0009 | [[partial-artifact]] |
| termination | hermes | 0009 | [[termination]] |
| approval gate | hermes | 0010 | [[approval-gate]] |
| default deny | hermes | 0010 | [[default-deny]] |
| JSON Lines | protocol | 0011 | [[json-lines]] |
| trace | hermes | 0011 | [[trace]] |
| fixture | hermes | 0012 | [[fixture]] |

## Phase 2: Graph RAG through MCP

| Lesson | Title | Lesson map |
| --- | --- | --- |
| 0013 | MCP Anatomy | [[lesson-0013-mcp-anatomy]] |
| 0014 | Evidence With Provenance | [[lesson-0014-evidence-with-provenance]] |
| 0015 | Test It Without an LLM | [[lesson-0015-test-it-without-an-llm]] |
| 0016 | Evidence Enters the Loop | [[lesson-0016-evidence-enters-the-loop]] |

| Term | Category | Lesson | Note |
| --- | --- | --- | --- |
| JSON-RPC | protocol | 0013 | [[json-rpc]] |
| MCP | protocol | 0013 | [[mcp]] |
| resource | protocol | 0013 | [[resource]] |
| transport | protocol | 0013 | [[transport]] |
| confidence | hermes | 0014 | [[confidence]] |
| derivation | hermes | 0014 | [[derivation]] |
| evidence item | validation | 0014 | [[evidence-item]] |
| provenance | hermes | 0014 | [[provenance]] |
| in-memory transport | protocol | 0015 | [[in-memory-transport]] |
| MCP client | protocol | 0015 | [[mcp-client]] |
| evidence port | hermes | 0016 | [[evidence-port]] |

## Phase 3: The workflow graph

| Lesson | Title | Lesson map |
| --- | --- | --- |
| 0017 | Thinking in State Graphs | [[lesson-0017-thinking-in-state-graphs]] |
| 0018 | The Loop Walks the Graph | [[lesson-0018-the-loop-walks-the-graph]] |
| 0019 | Interruption Is a State | [[lesson-0019-interruption-is-a-state]] |
| 0020 | LangGraph.js, Evaluated | [[lesson-0020-langgraph-js-evaluated]] |
| 0021 | The Spec Decides the Graph | [[lesson-0021-the-spec-decides-the-graph]] |

| Term | Category | Lesson | Note |
| --- | --- | --- | --- |
| guard | hermes | 0017 | [[guard]] |
| terminal node | hermes | 0017 | [[terminal-node]] |
| workflow graph | hermes | 0017 | [[workflow-graph]] |
| checkpoint | hermes | 0018 | [[checkpoint]] |
| graph interpreter | hermes | 0018 | [[graph-interpreter]] |
| node handler | hermes | 0018 | [[node-handler]] |
| approval queue | hermes | 0019 | [[approval-queue]] |
| parked run | hermes | 0019 | [[parked-run]] |
| checkpointer | sdk-layer | 0020 | [[checkpointer]] |
| conditional edge | sdk-layer | 0020 | [[conditional-edge]] |
| interrupt() | sdk-layer | 0020 | [[interrupt]] |
| LangGraph.js | sdk-layer | 0020 | [[langgraph-js]] |
| thread | sdk-layer | 0020 | [[thread]] |
| architecture decision record | hermes | 0021 | [[architecture-decision-record]] |
| job graph | hermes | 0021 | [[job-graph]] |

## Phase 4: Reliability and evaluation

| Lesson | Title | Lesson map |
| --- | --- | --- |
| 0022 | What the Run Cost | [[lesson-0022-what-the-run-cost]] |
| 0023 | OpenTelemetry, Evaluated | [[lesson-0023-opentelemetry-evaluated]] |
| 0024 | Landing the Outputs | [[lesson-0024-landing-the-outputs]] |
| 0025 | Golden Tasks | [[lesson-0025-golden-tasks]] |
| 0026 | Many Runs, One Verdict | [[lesson-0026-many-runs-one-verdict]] |
| 0027 | The Regression Gate | [[lesson-0027-the-regression-gate]] |

| Term | Category | Lesson | Note |
| --- | --- | --- | --- |
| budget alert | hermes | 0022 | [[budget-alert]] |
| cost report | hermes | 0022 | [[cost-report]] |
| span | hermes | 0022 | [[span]] |
| exporter | sdk-layer | 0023 | [[exporter]] |
| OpenTelemetry | sdk-layer | 0023 | [[opentelemetry]] |
| OTLP | protocol | 0023 | [[otlp]] |
| semantic convention | protocol | 0023 | [[semantic-convention]] |
| artifact | hermes | 0024 | [[artifact]] |
| atomic write | hermes | 0024 | [[atomic-write]] |
| golden task | hermes | 0025 | [[golden-task]] |
| grader | hermes | 0025 | [[grader]] |
| planted defect | hermes | 0025 | [[planted-defect]] |
| scorecard | hermes | 0025 | [[scorecard]] |
| pass rate | hermes | 0026 | [[pass-rate]] |
| pass@k | hermes | 0026 | [[pass-at-k]] |
| pass^k | hermes | 0026 | [[pass-hat-k]] |
| seeded fake | hermes | 0026 | [[seeded-fake]] |
| trial | hermes | 0026 | [[trial]] |
| baseline | hermes | 0027 | [[baseline]] |
| benchmark | hermes | 0027 | [[benchmark]] |
| promotion | hermes | 0027 | [[promotion]] |
| regression | hermes | 0027 | [[regression]] |
| regression gate | hermes | 0027 | [[regression-gate]] |
