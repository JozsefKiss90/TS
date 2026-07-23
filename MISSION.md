# Mission: Agentic Engineering with TypeScript

## Why
Progress from directing AI-generated implementations to designing, inspecting, and improving reliable agent systems. The concrete vehicle is the **Hermes Spec-to-Evidence Loop** — a bounded, typed, observable single-agent loop (validated TaskSpec → bounded planning → Graph RAG evidence → approved tool execution → evaluation → durable trace) that becomes the control plane of Hermes OS.

## Success looks like
- Explain and inspect the complete model/tool loop rather than merely invoke a framework.
- Define typed **and runtime-validated** contracts for tasks, state, tools, and evidence.
- Implement a bounded single-agent loop with permissions, budgets, approval, and termination.
- Expose and consume Graph RAG capabilities through MCP, testable without an LLM.
- Test orchestration offline with fakes and recorded fixtures; trace, resume, and diagnose runs.
- Decide rationally when a framework, an Agent SDK, or multiple agents are justified.

## Constraints
- Phase order: 0 TS/SDK literacy → 1 manual bounded loop → 2 Graph RAG via MCP → 3 workflow graph → 4 reliability/eval → 5 Claude Agent SDK → 6 multi-agent (only with benchmark evidence).
- Guiding principle: *put probabilistic reasoning inside a deterministic, typed, observable control system.* Static types vanish at runtime — validate at every JSON boundary.
- Keep the three graphs separate: knowledge (what Hermes knows), workflow (what it may do), trace (what it did).
- Settled: `hermes-sdk-lab/` lives in this repo; pnpm; mock-first (live API calls added later, cost route confirmed first); ~45–60 min sessions. Still open: provider neutrality as a Phase 1 acceptance criterion.

## Out of scope
- Multi-agent demos before evaluation justifies the coordination cost.
- Generic TypeScript syntax disconnected from Hermes concerns.
- Replacing Python where it is stronger (embeddings, data science, Graph RAG internals) — those stay behind typed ports/adapters.
