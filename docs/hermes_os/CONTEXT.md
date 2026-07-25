# Hermes OS

Design context for a Claude-assisted operating system combining Hermes (persistent orchestration)
with Claude Code (repo-local implementation), governed by an ontology-grounded engineering graph.

## Language

**Hermes**:
The persistent controller — scheduler, memory layer, model router, job supervisor, and messaging
surface. One layer of the OS, not the whole OS.
_Avoid_: "the agent", "the OS" (for Hermes alone)

**Claude Code**:
The repo-local implementation and verification engine. Executes typed jobs; never the orchestrator.
_Avoid_: "Claude" alone (ambiguous with the model family)

**RAG Factory**:
The v1 mission: Hermes-operated automation that constructs, audits, refreshes, and benchmarks
ontology-grounded RAG projects.
_Avoid_: "the OS" (for v1 scope)

**dev_graph**:
The canonical, ontology-governed engineering graph — the semantic authority for admissible context,
constraints, gates, and decisions.
_Avoid_: "knowledge graph" (that is the wiki), "code graph"

**CodeGraph**:
A derived, AST-based code-topology index: symbols, call paths, dependencies, impact radius,
affected tests. Never canonical.
_Avoid_: conflating with dev_graph

**Context Pack**:
A typed, admissibility-checked bundle of canonical nodes, constraints, code truth, permitted docs,
and acceptance criteria assembled for one Claude Code task.
_Avoid_: "prompt", "context" (unqualified)

**Open Decision**:
A surfaced, unresolved conflict or question recorded as an artifact; blocks affected work until a
human resolves it.
_Avoid_: "TODO", "note"

**Drift**:
Disagreement between dev_graph intent and code reality. Drift is a defect to surface, not a
conflict either side silently wins.
_Avoid_: "stale docs"

**Artifact Vault**:
The versioned `artifacts/` tree where every job's outputs — reports, eval results, dream briefs,
dashboards, PR summaries — persist, linked to jobs and costs.
_Avoid_: "chat history", "output folder", "Hermes folder" (that is the platform's synced document
panel, a different thing)

**Blueprint**:
A reusable RAG project pattern (karpathy_llm_wiki, ontology_first, …) consumed by `rag new`. The
repo folder `rag_blueprint/` holds a specific binding spec — the Dev Graph Operations Manual — not
a pattern; qualify which is meant.
_Avoid_: "template" (that is the Claude Code project skeleton repo)

**Job Envelope**:
The mandatory per-job contract: title, owner, model policy, tool policy, cost ceiling, output
artifact path, completion condition, cancellation rule. No envelope, no dispatch.
_Avoid_: "job config", "settings"

**Harness**:
One of the eight named blocking gate sets (source, ontology, wiki, graph, retrieval, answer,
agent, Hermes-native) that verify work before it lands.
_Avoid_: "tests" (unqualified), "checks"
