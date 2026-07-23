# Handoff: Learning Agentic Engineering with TypeScript

## Purpose of the next session

Use the supplied `/teach` skill to initialise and run a stateful teaching workspace whose mission is to help the user learn and master agentic engineering with TypeScript. Build the curriculum around a practical **Hermes Spec-to-Evidence Loop**, not a generic chatbot or a survey of agent frameworks.

The immediate next step is **Phase 0: TypeScript and SDK literacy**. The first teaching session should establish the workspace state, confirm a few unresolved constraints, and deliver one small practical lesson with a tangible result.

## Update (2026-07-23, after lesson 0001) — glossary wiki and diagrams

At the user's request, the glossary is now an **Obsidian wiki**, not a single `GLOSSARY.md` file: the repo root is a vault (DataView enabled), with one YAML-frontmattered note per term in `wiki/terms/`, a per-lesson map note in `wiki/lessons/`, and DataView indexes in `wiki/GLOSSARY.md`. Lessons also include **supplementary Mermaid diagrams** (vendored renderer in `assets/vendor/`). Where this handoff says "GLOSSARY.md" or "do not pre-fill the glossary", read it as: a lesson's terms are captured as wiki notes at `status: introduced` when taught, and promoted to `status: demonstrated` only on demonstrated use. Authoritative conventions: `NOTES.md` → Workspace conventions.

## Suggested skills

- **`/teach` — invoke first.** Follow the provided `SKILL.md` and its linked formats. This is a multi-session learning mission, so preserve state through `MISSION.md`, `RESOURCES.md`, `learning-records/`, lessons and reference documents.
- **`/grill-me` — use selectively.** Use it to interrogate specifications, assumptions and acceptance criteria for Hermes components, especially before implementation exercises. Do not let it replace hands-on teaching or automatic feedback.
- **`/handoff` — use at meaningful session boundaries.** Produce a new compact handoff when the learning session is likely to move to a fresh context. Reference existing teaching artifacts rather than duplicating them.
- **Official-documentation research.** Consult current primary documentation before teaching SDK behaviour or version-specific APIs. SDK examples are unusually vulnerable to version drift and plausible hallucination.

## Source instructions and templates

- <https://github.com/mattpocock/skills/tree/main>
- `SKILL.md` — `/teach`
- `SKILL(1).md` — `/handoff`
- `MISSION-FORMAT.md`
- `RESOURCES-FORMAT.md`
- `LEARNING-RECORD-FORMAT.md`
- `GLOSSARY-FORMAT.md`

Read and follow these files rather than reproducing their instructions in the teaching workspace.

## User's goal and motivation

The user has completed several large vibe-coding projects and wants to progress from directing AI-generated implementation toward understanding and designing reliable agent-oriented systems. They are currently developing the idea of a **Hermes OS** (for more information: 'C:\Code\Hermes OS\.scratch')  that automates recurring Claude Code workflows, uses looped execution, and can draw on ontology-grounded or Graph RAG knowledge.

Their goal is not merely to learn TypeScript syntax. They want to become capable of designing, implementing, inspecting and improving agent harnesses: typed tools, explicit state, bounded loops, permissions, evidence retrieval, evaluation, observability, checkpointing and recovery.

## Established prior knowledge

Treat these as claimed starting knowledge, not as mastery of agent engineering:

- Experience with several large-scale vibe-coding projects.
- Uses spec-driven development.
- Builds or uses knowledge graphs and Graph RAG systems.
- Frequently uses the Grill Me skill to expose missing assumptions and refine specifications.
- Is exploring loop engineering and automation through a Hermes OS concept.
- Has some object-oriented programming knowledge.
- Has previously used TypeScript for web development.
- SDKs are new to the user; they explicitly asked that SDK literacy be included in Phase 0.

Under the `/teach` rules, the disclosures about OOP, TypeScript web development, spec-driven development and Graph RAG qualify for terse initial learning records because they change the appropriate starting level. Do not create glossary entries merely because terminology appeared in this conversation; promote terms only after the user demonstrates understanding.

## Agreed technical position

TypeScript is recommended primarily for the **Hermes control plane**, including:

- tool and message contracts;
- workflow and state orchestration;
- MCP clients and servers;
- runtime validation of external and model-generated data;
- streaming, asynchronous I/O and cancellation;
- permissions, budgets and stop conditions;
- evaluation and observability;
- CLI, service and web interfaces.

Do not frame TypeScript as the only valid language for agents. Retain Python where it is advantageous for embeddings, data science, scientific computing, specialised retrieval or existing Graph RAG components. Use typed ports/adapters across the boundary.

The central engineering principle established in the conversation is:

> Put probabilistic reasoning inside a deterministic, typed and observable control system.

TypeScript's static types improve structural correctness but disappear at runtime. LLM outputs, API responses, retrieved records and tool arguments remain untrusted and require runtime validation, initially with Zod or an equivalent schema library.

Prefer composition, explicit state and small functions over deep OOP inheritance. An agent should not become a giant class with an opaque `run()` method.

## Canonical use case: Hermes Spec-to-Evidence Loop

Use the following as the curriculum's continuing vertical slice:

```text
idea or request
  -> Grill Me specification interrogation
  -> validated TaskSpec and success criteria
  -> bounded planning
  -> evidence retrieval from Graph RAG
  -> approved tool execution
  -> evidence-based evaluation
  -> accept, revise, escalate or fail
  -> durable trace
```

The first implementation must be a bounded **single-agent** loop. Introduce multiple agents only when evaluation demonstrates that role separation improves results enough to justify added coordination and failure modes.

### Core concepts the implementation should make explicit

- **Goal:** validated task specification and success criteria.
- **Capabilities:** typed, independently testable tools.
- **Working state:** explicit serialisable run state, not only chat history.
- **Policy:** model instructions plus deterministic routing rules.
- **Autonomy boundary:** permissions, budgets, timeouts, iteration limits and approval gates.
- **Evidence:** source-bearing retrieval results linked to claims and decisions.
- **Evaluation:** an explicit verdict against success criteria.
- **Trace:** append-only events explaining what happened without pretending to reveal hidden model reasoning.

### Keep three graph types separate

1. **Knowledge graph / Graph RAG:** what Hermes knows.
2. **Workflow or state graph:** what Hermes may do next.
3. **Trace graph:** what Hermes actually did.

Use task, run, source and artifact identifiers to link them, but do not collapse them into one universal graph schema.

## Curriculum phases

### Phase 0 — TypeScript and SDK literacy

Teach TypeScript through the concerns needed for SDK integration and agent harnesses:

- strict compiler configuration;
- ES modules, package management and lockfiles;
- `unknown`, narrowing and error handling;
- discriminated unions and exhaustiveness;
- generics for tool contracts;
- promises, async iterators and streaming;
- cancellation with `AbortController`;
- immutable, serialisable state;
- JSON boundaries and runtime validation;
- reading generated type declarations and SDK source;
- dependency injection through interfaces and test doubles.

Teach the distinction between API, protocol, library, client SDK, protocol SDK, agent SDK, framework, CLI and runtime. The user should learn the recurring anatomy of an SDK: installation and versions, authentication, client creation, request/response types, streaming, pagination where relevant, retries, timeouts, cancellation, rate limits, errors, mocking, observability and the raw-HTTP escape hatch.

Build a small `hermes-sdk-lab` progression:

```text
01-raw-http
02-model-client-sdk
03-streaming-and-cancellation
04-manual-tool-loop
05-mcp-server
06-mcp-client-and-inspector
07-observability
08-tested-adapters
```

The important sequence is ordinary model client SDK first, higher-level Agent SDK later. The user should see what the SDK abstracts rather than treating it as magic.

### Phase 1 — Manual bounded single-agent loop

Implement a framework-free Hermes kernel with a validated `TaskSpec`, a model gateway, two or three tools, explicit run-state variants, argument/result validation, cost and iteration limits, approval, evaluator, append-only events, checkpointing and fakes for tests.

### Phase 2 — Graph RAG through MCP

Expose a deliberately small Graph RAG surface, initially resembling:

- `search_concepts`
- `get_node`
- `traverse_relations`
- `retrieve_evidence`
- `record_observation`

Tools must return structured evidence with provenance and be testable through the MCP Inspector without an LLM. Keep the domain interfaces independent of MCP-specific types.

### Phase 3 — Explicit workflow graph and persistence

Reimplement the understood manual loop using LangGraph.js if the priority is learning state-graph orchestration, persistence, interruption and resumption. Consider Mastra instead if the priority changes toward rapidly assembling an integrated TypeScript agent product. Do not learn both simultaneously.

### Phase 4 — Reliability and evaluation

Add golden tasks, fixtures, fake models, replayable events, failure injection, regression tests, traces, cost/latency accounting, checkpoint/resume and human approval. Evaluate retrieval and orchestration separately before evaluating the complete system.

### Phase 5 — Claude Agent SDK integration

Only after the manual loop is understood, assess which Claude Code-like capabilities should be delegated to the Claude Agent SDK and which Hermes policies must remain outside it. Avoid coupling the entire domain model to provider-specific SDK types.

### Phase 6 — Evidence-justified multi-agent coordination

Introduce specialists, handoffs or a supervisor only for benchmarked cases where a single agent with tools is insufficient. Require explicit ownership, message contracts, budgets, termination and conflict-handling rules.

## Recommended architecture boundary

Hermes domain code should depend on local interfaces such as `ModelGateway`, `KnowledgeGateway`, `Tool`, `CheckpointStore`, `ApprovalPolicy` and `TraceSink`. Provider and protocol packages should be implemented as adapters, for example:

```text
AnthropicModelGateway -> ModelGateway
McpKnowledgeGateway   -> KnowledgeGateway
OpenTelemetryTraceSink -> TraceSink
FakeModelGateway      -> ModelGateway
```

This boundary enables offline tests, provider comparison, SDK upgrades and cost-controlled evaluation.

## Initial resource set

Populate `RESOURCES.md` with a small annotated set of primary sources. Begin with:

- TypeScript Handbook: <https://www.typescriptlang.org/docs/handbook/intro.html>
- Zod documentation: <https://zod.dev/>
- Anthropic client SDK documentation: <https://docs.anthropic.com/en/api/client-sdks>
- Claude Agent SDK overview: <https://docs.anthropic.com/en/docs/claude-code/sdk>
- Claude tool-use documentation: <https://docs.anthropic.com/en/docs/build-with-claude/tool-use/overview>
- MCP introduction and SDKs: <https://modelcontextprotocol.io/docs/getting-started/intro> and <https://modelcontextprotocol.io/docs/sdk>
- MCP server guide and Inspector: <https://modelcontextprotocol.io/docs/develop/build-server> and <https://modelcontextprotocol.io/docs/tools/inspector>
- LangGraph.js overview and graph-thinking guide: <https://docs.langchain.com/oss/javascript/langgraph/overview> and <https://docs.langchain.com/oss/javascript/langgraph/thinking-in-langgraph>
- OpenTelemetry JavaScript: <https://opentelemetry.io/docs/languages/js/>
- Temporal SDK concepts for later durable execution: <https://docs.temporal.io/encyclopedia/temporal-sdks>

Annotate each resource with what it supports and when to use it. Verify documentation against installed package versions before teaching code.

## Teaching-workspace bootstrap

On invoking `/teach`:

1. Read the supplied `/teach` instructions and formats.
2. Confirm the mission in a short exchange only if the unresolved constraints below materially change it.
3. Create a concise `MISSION.md` centred on shipping and understanding the Hermes Spec-to-Evidence Loop.
4. Create the initial `RESOURCES.md` from primary sources.
5. Record only the disclosed prior knowledge in initial learning records; do not claim concepts covered in this handoff have been learned.
6. Create a shared lesson stylesheet under `assets/` before the first HTML lesson.
7. Create the first tightly scoped lesson for Phase 0 with retrieval practice and immediate feedback.
8. Create reference material only when it compresses knowledge the user will reuse; do not pre-fill the glossary.

## Recommended first lesson

**Title:** Trace One Request Through an API and a TypeScript SDK

**Tangible win:** the user can explain which work belongs to HTTP/API semantics and which work the SDK performs, then inspect a minimal TypeScript program and identify authentication, client construction, request type, response type, error boundary and cancellation point.

Suggested exercise:

1. Present a small raw `fetch` request and an equivalent official SDK request.
2. Ask the user to map each SDK line to the hidden HTTP responsibility.
3. Have them predict what TypeScript can validate and what still needs runtime validation.
4. Run a short equal-length-option quiz or classification task with automatic feedback.
5. End by asking the user to state, in their own words, the difference between an API and an SDK.

Only after demonstrated understanding should those terms be compressed into `GLOSSARY.md` or a learning record.

## Open decisions for the next agent

Ask only what is necessary before implementation:

- Where should the durable teaching workspace and `hermes-sdk-lab` repository live?
- Which Node package manager should be standardised on: npm, pnpm or an existing project choice?
- Does the user want exercises to call a paid model API immediately, or begin with mock/local responses and add live calls later?
- What weekly time budget and preferred session length should shape lesson size and spacing?
- Should Hermes initially integrate only Claude, or should provider neutrality be an explicit Phase 1 acceptance criterion?

Do not assume that an interactive Claude or Claude Code subscription automatically supplies API credentials or covers SDK-based API charges. Confirm the intended authentication and cost route before a live provider exercise.

## Success criteria for the teaching mission

The mission is succeeding when the user can:

- explain and inspect the complete model/tool loop rather than merely invoke a framework;
- define typed and runtime-validated contracts for tasks, state, tools and evidence;
- implement a bounded single-agent loop with approval and termination;
- expose and consume Graph RAG capabilities through MCP;
- separate knowledge, workflow and trace graphs;
- test orchestration without a live model using fakes and recorded fixtures;
- trace, evaluate, resume and diagnose a run;
- decide rationally when a framework, Agent SDK or multiple agents are justified;
- evolve Hermes without binding its domain model to one provider SDK.

## Avoid

- Starting with a multi-agent demo.
- Treating a framework quickstart as mastery of agentic engineering.
- Teaching generic TypeScript syntax disconnected from Hermes.
- Conflating knowledge graphs with execution graphs.
- Relying on TypeScript types for runtime trust.
- Filling learning records with material merely discussed.
- Pre-populating a glossary before the user demonstrates correct use.
- Generating a large course in advance; preserve the `/teach` skill's short, feedback-driven lesson cadence.
