# Roadmap — Agentic Engineering with TypeScript

The course builds the **Hermes Spec-to-Evidence Loop** — a bounded, typed, observable single-agent loop (validated TaskSpec → bounded planning → Graph RAG evidence → approved tool execution → evaluation → durable trace) that becomes the control plane of Hermes OS. Guiding principle: *put probabilistic reasoning inside a deterministic, typed, observable control system.* Full rationale: [MISSION.md](MISSION.md).

## How to read this file

- **This is a plan, not a syllabus.** Lessons are authored one at a time, feedback-first (house rule: never generate a large course in advance). Shipped entries are history; the next lesson is firm; everything further is provisional — titles, counts, and order get resequenced as feedback lands. The *why* behind every change is recorded in [NOTES.md](NOTES.md) dated updates.
- **Status:** ✅ shipped · ▶ next up · ○ planned (provisional scope) · ⛔ gated (entry criterion unmet)
- **Numbering:** `NNNN` ids are firm through the next lesson; later ids are placeholders and may shift. Phase 2+ lessons get ids when their phase opens.
- One lesson ≈ one session (~45–60 min). Every lesson ships three things: the HTML lesson, its glossary-wiki cluster (`wiki/terms/` + lesson map), and at least one Mermaid diagram. Lab exercises live in `hermes-sdk-lab/` (pnpm workspace, **mock-first** — live API calls only after the cost/auth route is confirmed).
- Standing separations that shape the whole sequence: the three graphs never merge (**knowledge** = what Hermes knows · **workflow** = what it may do · **trace** = what it did); model-client SDK before Agent SDK; single-agent before multi-agent; raw HTTP before SDK.
- **Graph form & governance:** this plan as Mermaid module graphs: [wiki/course/course-module-graph.md](wiki/course/course-module-graph.md) — kept in sync when a status flips. What a lesson must be: [CLAUDE.md](CLAUDE.md) (the constitution). What the course means — terminal skills and the Hermes OS integration scenario (steps S1–S9) every lesson anchors to: [wiki/course/](wiki/course/COURSE.md).

---

## Phase 0 — TS/SDK literacy — *complete, 5 of 5 shipped (2026-07-27)*

**Goal:** see exactly what an SDK does to an API, so nothing downstream is magic — and end with contracts that are typed **and runtime-validated**.
**Exit criteria:** trace the full request lifecycle from memory; read a package's `.d.ts` as the real contract; never let untrusted bytes past a boundary without a runtime check.

| # | Lesson | Lab | The win | Status |
|---|---|---|---|---|
| 0001 | [Trace One Request — API vs SDK](lessons/0001-trace-one-request-api-vs-sdk.html) | — | the six responsibilities (① endpoint ② auth ③ version ④ contract ⑤ errors ⑥ cancellation); response types are compile-time claims about runtime bytes | ✅ |
| 0002 | [Raw HTTP Against a Mock](lessons/0002-raw-http-against-a-mock.html) | `01-raw-http` | every responsibility written by hand against a test double; the base-URL seam | ✅ |
| 0003 | [The SDK Absorbs the Six Responsibilities](lessons/0003-the-sdk-absorbs-the-six.html) | `02-model-client-sdk` | the official SDK against the same mock — mechanics absorbed, policy left behind; typed errors, retries, declaration files | ✅ |
| 0004 | [The Response Becomes a Process](lessons/0004-the-response-becomes-a-process.html) | `03-streaming-and-cancellation` | SSE event grammar; the delta fold; cancellation becomes a cost lever | ✅ |
| 0005 | [Validate the Boundary](lessons/0005-validate-the-boundary.html) | `04-validate-the-boundary` | Zod turns the assertion into a checked parse; `z.infer` as single source of truth — the debt open since lesson 0001 §3, and the close of Phase 0 | ✅ |

*Lesson maps in the wiki: [[lesson-0001-trace-one-request]] · [[lesson-0002-raw-http-against-a-mock]] · [[lesson-0003-the-sdk-absorbs-the-six]] · [[lesson-0004-the-response-becomes-a-process]] · [[lesson-0005-validate-the-boundary]].*

---

## Phase 1 — The manual bounded loop — *complete, 7 of 7 shipped (2026-09-01)*

**Goal:** implement the Hermes loop by hand — bounded, permissioned, budgeted, traceable — before any framework touches it.
**Entry decision:** provider neutrality vs Claude-only — **decided in lesson 0006 (2026-07-29): provider-neutral port, exactly one live adapter.** Neutrality is a property of the seam (Hermes-owned vocabulary in `gateway.ts`); provider choice is policy above the port; the `FakeModelGateway` is the second implementation that keeps the contract honest. Rationale in NOTES.md.
**Exit criteria (from MISSION):** a bounded single-agent loop with permissions, budgets, approval, and termination — testable offline with fakes and recorded fixtures.

| # (prov.) | Lesson | Lab (prov.) | The win | Status |
|---|---|---|---|---|
| 0006 | [The Model Gateway](lessons/0006-the-model-gateway.html) | `05-model-gateway` | wrap the SDK behind a port: mechanics below, policy above; the provider-neutrality decision lands; `FakeModelGateway` exists from day one | ✅ |
| 0007 | [The TaskSpec Is a Contract](lessons/0007-the-taskspec-is-a-contract.html) | `06-taskspec` | a Zod-validated TaskSpec — invalid work rejected before a token is spent, measured at zero requests; `.default()` splits input from output types; cross-field rules become refinements | ✅ |
| 0008 | [Tool Use, the Loop's Heartbeat](lessons/0008-tool-use-the-loops-heartbeat.html) | `07-tool-loop` | `tool_use` / `tool_result` blocks, `stop_reason: "tool_use"`, one manual iteration end to end; the transcript becomes Hermes's, and `allowedTools` gets its first reader | ✅ |
| 0009 | [Bounds and Termination](lessons/0009-bounds-and-termination.html) | `07-tool-loop` | every bound moves into the spec (call cap, token ceiling, deadline); the gateway streams so an `AbortController` can kill a generation mid-flight; the partial output is kept | ✅ |
| 0010 | [Approval Gates and Permissions](lessons/0010-approval-gates-and-permissions.html) | `07-tool-loop` | permission gets a third level (unlisted / permitted / approval-required), all spec data; the operator is a port, absent means denied; a denial goes back as a failed tool result; the approval wait races the bounds | ✅ |
| 0011 | [The Trace Is What Happened](lessons/0011-the-trace-is-what-happened.html) | `07-tool-loop` | every supervisor decision appended as one JSON Lines event, through a third port, at the moment it happens; a finished run diagnosed and an interrupted run resumed from the file alone (ledger carried, clock restarted); reading your own past is the fourth Zod boundary | ✅ |
| 0012 | [Offline by Construction](lessons/0012-offline-by-construction.html) | `08-tested-adapters` | the whole loop runs green with fakes and recorded fixtures — no LLM, no network; 29 tests reproduce Part A's 217 tokens and 8 trace events from recorded bytes, and the regenerated request matches the recording byte-for-byte; Phase 1's capstone | ✅ |

*Provisional shape: labs `07-tool-loop` onward evolve one codebase across lessons rather than starting fresh each time. Expect this table to compress or split as sessions reveal pace.*

*Lesson maps in the wiki: [[lesson-0006-the-model-gateway]] · [[lesson-0007-the-taskspec-is-a-contract]] · [[lesson-0008-tool-use-the-loops-heartbeat]] · [[lesson-0009-bounds-and-termination]] · [[lesson-0010-approval-gates-and-permissions]] · [[lesson-0011-the-trace-is-what-happened]] · [[lesson-0012-offline-by-construction]].*

*Supplement (2026-07-29): [0006a — Hermes Architecture Primer: Where the Model Gateway Fits](lessons/0006a-hermes-architecture-primer.html) — the Spec-to-Evidence Loop drawn end to end, "policy" defined operationally, and an implemented/seeded/planned ledger for exercise 05 (a one-call policy seed; no routing, budgets, permissions, or trace yet). Durable reference: [wiki/course/course-architecture.md](wiki/course/course-architecture.md). Defect record: [[course-pedagogy]] row 12. Adds no capability and shifts no lesson — 0007 remains next.*

*Supplement (2026-07-30): [0006b — The Hermes Control Plane: From Job to Evidence](lessons/0006b-the-hermes-control-plane.html) — the Claude-Assisted Hermes OS from its governance record (PDR-001, ADR-0001..0021): the Hermes job as the unit of work (envelope · Context Pack · lifecycle), the control-plane components, capability routing before model routing, the gateway map, and the Model Gateway's placement rule — with every claim labeled accepted / scaffolded / planned / proposed clarification / open decision. Reading order: 0006 §1 → 0006b → 0006a → the rest. Durable reference: [docs/hermes_os/architecture/hermes-job-control-plane.md](docs/hermes_os/architecture/hermes-job-control-plane.md) (mirror; canonical in the `hermes-os` repo). Defect record: [[course-pedagogy]] row 13. Adds no capability and shifts no lesson — 0007 remains next.*

---

## Phase 2 — Graph RAG through MCP — *gate met 2026-09-01; opens next, ids assigned then*

**Goal:** expose the existing (Python-side) Graph RAG capability as typed MCP tools with provenance-bearing evidence — *exposing*, not re-teaching retrieval (prior experience: learning-records/0003).
**Guardrail:** graph fluency will tempt a merged schema — knowledge, workflow, and trace graphs stay separate.
**Prerequisite:** find a high-trust written source on evidence-schema design to compare against practice (RESOURCES gap).

Planned lesson arc (ids assigned when the phase opens):

- **MCP Anatomy** — a server is a typed tool surface: tools, resources, transport; build a minimal server and poke it with the Inspector.
- **Evidence With Provenance** — the Zod evidence schema; the knowledge-graph port; Python stays behind a typed adapter.
- **Test It Without an LLM** — Inspector plus a scripted client; recorded evidence fixtures join the fake-first toolkit.
- **Evidence Enters the Loop** — bounded planning consumes evidence; the loop's evidence step goes live against the MCP surface.

**Exit criteria (from MISSION):** Graph RAG capabilities exposed and consumed through MCP, testable without an LLM.

---

## Phase 3 — The workflow graph — *gated on Phase 2 exit*

**Goal:** the loop's control flow becomes an explicit state graph — what Hermes *may* do, encoded as data.
**Framework decision:** LangGraph.js is the candidate (persistence, interruption); evaluated, not assumed — and never learned alongside an alternative in the same phase.

- **Thinking in State Graphs** — when a framework earns its keep; map the manual loop's states and edges on paper first.
- **The Loop Becomes a Graph** — port the Phase 1 loop; checkpointing, interruption, resume.
- **The Workflow Graph Is Policy** — permissions and approval gates live on the graph's edges; the second of the three graphs, kept apart from the other two.

**Exit criteria:** the manual loop runs under graph orchestration with persistence and interruption — with a written justification of what the framework bought.

---

## Phase 4 — Reliability and evaluation — *gated on Phase 3 exit*

**Goal:** make claims about the loop with evidence: traces, costs, golden tasks, regressions.
**Prerequisite:** vet a primary source for agent-harness evaluation (golden tasks, replayable fixtures) — RESOURCES gap flagged since session 1.

- **Traces and Spans** — OpenTelemetry on the loop; cost and latency accounting per step; the trace graph earns its keep.
- **Golden Tasks and Replay** — recorded fixtures grow into a benchmark harness; deterministic replays of probabilistic runs.
- **Eval-Driven Decisions** — regression gates; the benchmark that any Phase 6 ambition must answer to.

**Exit criteria (from MISSION):** trace, resume, and diagnose runs; framework and architecture decisions made on measurements, not taste.

---

## Phase 5 — The Claude Agent SDK — *gated on Phase 4 exit; deliberately held back until now*

**Goal:** meet the Agent SDK the way lesson 0003 met the client SDK — as a layer whose absorbed responsibilities you can already name, because you built each one by hand.

- **The Agent SDK Absorbs the Loop** — map every Phase 1 concept (loop, tools, permissions, budgets, trace) onto what the Agent SDK provides; find what it does *not* do.
- **Adopt, Wrap, or Keep** — the decision lesson: which parts of Hermes move onto the harness, which stay behind Hermes's own ports — argued from the Phase 4 benchmark.

**Exit criteria:** a rational, written adopt/wrap/skip decision per subsystem — "the SDK is not magic" passed at the agent level.

---

## Phase 6 — Multi-agent — *⛔ gated on benchmark evidence*

**Entry criterion (hard):** a Phase 4 benchmark showing a mission-relevant task where the single-agent loop's ceiling — not its tuning — is the blocker. No evidence, no phase. MISSION lists premature multi-agent demos as explicitly out of scope.

- **When Two Agents Beat One** — coordination cost accounted honestly against the measured single-agent baseline.
- **Orchestration, As Much As the Evidence Buys** — only the patterns the benchmark justifies; the loop remains the unit of control.

**Exit criteria:** multi-agent coordination that beats the single-agent baseline on the benchmark that gated it — or a documented decision that one agent is enough.

---

## Standing threads across all phases

- **Mock-first cost route:** every lab runs offline by default. Before the first live-call exercise (likely Phase 1), confirm the auth/billing route — a Claude subscription does not supply API credentials, and the user currently holds no API key.
- **Glossary discipline:** terms enter at `status: introduced`, promote to `demonstrated` only on demonstrated use — the wiki's *Awaiting promotion* view is the retrieval-practice queue for every session.
- **Python's territory is respected:** embeddings, data science, Graph RAG internals stay Python-side behind typed ports — the course never rebuilds them in TypeScript.
