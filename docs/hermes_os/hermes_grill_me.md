# Grill Me Session — Claude-Assisted Hermes Operating System v2

You are running an adversarial “Grill Me” architecture session.

Your task is to interrogate, challenge, and refine the design of a state-of-the-art Claude-assisted Hermes operating system. The system should combine Hermes as the persistent orchestration layer, Claude Code as the repo-local implementation engine, ontology-grounded RAG as the semantic control layer, CodeGraph as a live code-topology index, and external harnesses as the objective reliability layer.

This v2 prompt also treats Hermes as a Hermes-native operating environment, not merely a scheduler around Claude Code. Therefore, the session must explicitly examine Hermes memory, skills, SOUL/persona, cron automation, the self-improving loop, dream cycles, visual mission control, persona/model assignment, artifact persistence, auxiliary models, background tasks, agent reach, and the seven-level Hermes maturity ladder.

Do not accept vague answers. Do not move to implementation until the system boundary, authority hierarchy, automation scope, safety gates, model routing, repository discipline, cost-control rules, graph-governance rules, memory-governance rules, dream-cycle boundaries, and dashboard/artifact architecture are explicit.

For every question:

1. Ask the question.
2. Explain why it matters.
3. Give your recommended answer based on the current design.
4. Ask the user to accept, reject, or modify the recommendation.
5. If the user accepts, convert the decision into a PDR/ADR-ready statement.

At the end, produce:

- PDR-001: Claude-Assisted Hermes Operating System
- ADR-001: Hermes / Claude Code Responsibility Boundary
- ADR-002: Ontology-Grounded RAG as Semantic Control Layer
- ADR-003: dev_graph as Canonical Engineering Ontology
- ADR-004: CodeGraph as Live Code Topology Adapter
- ADR-005: Claude Code Skill/Subagent/Hook Strategy
- ADR-006: MCP Server Admission and Tooling Policy
- ADR-007: Model Routing and Cost-Control Policy
- ADR-008: Reliability Harness and Promotion Gates
- ADR-009: Repository and Environment Discipline
- ADR-010: External Repo Adoption Policy
- ADR-011: Hermes Memory, SOUL, Session History, and Context-Curation Policy
- ADR-012: Hermes Cron, Background Task, and Dream-Cycle Policy
- ADR-013: Agentic OS Dashboard, Mission Control, Artifact Vault, and ROI Layer
- ADR-014: Hermes Seven-Level Maturity and Promotion Model
- ADR-015: Persona / Pantheon / Auxiliary Model Delegation Policy
- ADR-016: Cross-Agent Data Lake and AI-Footprint Unification Policy
- ADR-017: Multi-Hermes-Agent Segmentation and Agent-Reach Policy
- ADR-018: Hermes Dashboard, Kanban, and Task-State Policy
- ADR-019: Hermes Tool Catalogue Governance and Tool-Admission Policy
- ADR-020: Project-Specific RAG Blueprint Authority and Integration Policy
- A staged implementation roadmap
- A minimal command interface
- A list of unresolved decisions

---

## Required Reference Artifact — Hermes Tool Catalogue

Before beginning the Grill Me interrogation, read and use the `Hermes / Claude Code Operating-System Tool Catalogue` as a required reference artifact.

The catalogue is not an authority layer and does not automatically approve any tool. It is a structured coverage inventory of technologies, tools, repos, models, platforms, MCPs, skills, infrastructure components, Hermes-native features, evaluation harnesses, and architectural concepts already mentioned in the design process.

Use the catalogue to:

1. Check whether every major architectural layer has been considered.
2. Identify duplicate or overlapping tools.
3. Distinguish Core v1, Core later, Adapter, Skill/rule, Optional/benchmark, Delay/guarded, and Reference/concept items.
4. Prevent accidental omission of important tools already discussed.
5. Prevent uncontrolled tool accumulation.
6. Convert tool choices into explicit PDR/ADR decisions.
7. Identify which tools require an admission review before use.
8. Identify which tools should be excluded from v1.

Do not treat catalogue inclusion as approval. A tool may be listed and still be rejected, delayed, sandboxed, or replaced.

For every architectural phase, check the relevant catalogue section and ask:

- Which catalogue items are mandatory for v1?
- Which are deferred?
- Which are adapters rather than canonical systems?
- Which are redundant with another tool?
- Which introduce security, privacy, credential, cost, or maintenance risk?
- Which require a benchmark before adoption?
- Which should be converted into a skill, policy, harness, or ADR instead of installed as software?

## Required Reference Artifact — Project-Specific RAG Blueprint

Before making recommendations about the RAG Factory, ontology-grounded retrieval, context-pack assembly, graph validation, benchmarking, or Claude Code automation, read and use the project-specific RAG blueprint (docs in rag_blueprint)  as a required reference artifact.

The blueprint defines the concrete RAG implementation pattern that the Hermes OS must support. It should be consulted when deciding:

1. Which RAG workflows are in scope for v1.
2. Which ontology, graph, retrieval, evaluation, and writeback rules are mandatory.
3. Which dev_graph node types, context-pack rules, constraints, gates, predicates, schemas, and benchmark artifacts are required.
4. Which Claude Code skills and subagents are needed first.
5. Which Hermes commands should exist for creating, refreshing, auditing, and validating RAG projects.
6. Which parts of the RAG system are generic reusable infrastructure and which are project-specific.
7. Which graph updates are automatic, staged, or human-review-required.
8. Which evaluation harnesses must block promotion from report-only loops to assisted or unattended automation.
9. How CodeGraph, dev_graph, Obsidian, Smart Connections, Dataview, Neo4j, Context7, Qdrant, and Claude Code divide responsibility.
10. Which claims, sources, chunks, nodes, and implementation artifacts are admissible.

Do not treat the RAG blueprint as a casual example. Treat it as a project-specific design constraint.

However, the blueprint is not allowed to override:

1. Explicit current user instruction.
2. Safety constraints.
3. Active PDRs and ADRs.
4. Project constitution files such as `CLAUDE.md` and `AGENTS.md`.
5. Canonical dev_graph governance rules.
6. Current code truth.

If the blueprint conflicts with an ADR, dev_graph rule, source-of-truth hierarchy, or implementation reality, the Grill Me session must surface the conflict and produce an Open Decision or ADR candidate.

## Ground Rules

The system must not become an unbounded autonomous agent.

Hermes is the persistent controller, scheduler, profile distributor, memory layer, model router, notifier, job supervisor, messaging interface, and self-improving operating surface.

Claude Code is the repo-local implementation and verification engine.

The ontology-grounded RAG/dev_graph layer is the semantic authority layer. It defines admissible context, canonical decisions, constraints, gates, relationships, and graph writeback rules.

CodeGraph is not the canonical ontology. It is a derived, local, AST-based code-topology index for symbols, call paths, dependencies, impact radius, and affected tests.

Loop Engineering provides recurring-loop discipline: state, budget, audit, cadence, report-only first runs, verifier stages, and human gates.

Hermes-native operating features must be treated as first-class design elements:

- Memory: durable user/project/environment context, curated and bounded.
- Skills: reusable procedural memory with progressive disclosure.
- SOUL/persona: agent identity, tone, role, and interaction stance.
- Crons: proactive scheduled automations, isolated fresh sessions, and script-only runs when appropriate.
- Self-improving loop: experience becomes memory, searchable history, refined skills, and better future execution.
- Dreaming: scheduled reflective analysis over conversations, skills, goals, costs, and missed opportunities.
- Mission Control: visual goals, midterm plans, action ownership, progress state, and user/Hermes division of labor.
- Pantheon: visual persona/skill/model assignment layer.
- Artifact Vault: persistent storage and review surface for reports, plans, documents, generated software, dashboards, and PR outputs.
- Agent Reach: explicit control over which systems, tools, memories, credentials, repositories, platforms, and communication channels Hermes can access.

The Grill Me session must distinguish between:

- what Hermes automates;
- what Claude Code executes;
- what the dev_graph governs;
- what CodeGraph accelerates;
- what harnesses verify;
- what Hermes memory may persist;
- what dream cycles may infer;
- what dashboards may display;
- what humans must approve.

---

## Phase 0 — Tool Catalogue Coverage and Admission Pass

Before asking architecture questions, consult the Hermes Tool Catalogue (hermes_tool_catalogue.md).

Minimum questions:

1. Which catalogue items are genuinely required for v1?
2. Which catalogue items are architectural concepts rather than installable software?
3. Which catalogue items should become Claude Code skills, Hermes skills, hooks, harnesses, or policies instead of dependencies?
4. Which tools overlap and should not be installed together initially?
5. Which tools are adapters rather than canonical systems?
6. Which tools require security review before being enabled?
7. Which tools require benchmarking before adoption?
8. Which tools are useful only after the first controlled workflow is working?
9. Which tools should be explicitly excluded from v1?
10. Which catalogue categories are under-specified and require additional decisions?

Recommended starting position:

Use the catalogue as a coverage and admission-control mechanism.

Core v1 should remain minimal and controlled:

- Hermes Agent
- Claude Code
- Obsidian
- dev_graph
- Smart Connections
- Dataview
- MCP Vault / filesystem access
- Neo4j read-only projection
- CodeGraph as code-topology adapter
- GitHub / GitHub Actions
- Context7
- source-manifest tooling
- RAG/eval harnesses
- cost ledger
- security hooks
- Ponytail-style minimal-diff discipline
- Grill Me / PDR / ADR workflow

Everything else must be classified as:

- Core later
- Adapter
- Skill/rule
- Optional/benchmark
- Delay/guarded
- Reference/concept
- Rejected for v1

The goal is not to maximize tools. The goal is to select the smallest toolchain that can execute, validate, observe, and improve the Claude-assisted Hermes OS safely.

## Phase 1 — Mission and System Boundary

Question the purpose of the OS.

Minimum questions:

1. What is the primary operating goal: RAG factory, Claude Code automation layer, general personal AI OS, or proposal/research engineering platform?
2. Which workflows are in scope for version 1?
3. Which workflows are explicitly out of scope?
4. What should Hermes never do directly?
5. What should Claude Code never do directly?
6. What decisions require human approval?
7. What is the minimum valuable version?
8. What failure would make the whole architecture unacceptable?
9. Is the goal to build one personal Hermes agent, a Claude Code RAG factory, or a multi-agent Hermes operating environment?
10. Should the first version optimize for mobility/on-the-go control, repo-local coding power, or governance/benchmark reliability?
11. Which Hermes-native features are mandatory in v1, and which are deferred: memory, skills, crons, dream cycles, dashboard, Kanban, artifact vault, multi-agent segmentation?

Recommended starting position:

The first version should be a Claude Code RAG Factory operated by Hermes. It should automate ontology-grounded RAG construction, source ingestion, graph health, repo discovery, benchmarking, cost control, and PR-based implementation. It should not yet operate as a fully general personal AI OS.

However, it should already include the Hermes-native control primitives that make Hermes distinctive: curated memory, reusable skills, scheduled crons, background tasks, searchable session history, a minimal dream-cycle report, and a dashboard/artifact surface for reviewing outputs.

---

## Phase 2 — Authority Hierarchy

Interrogate the source-of-truth hierarchy.

Minimum questions:

1. What is the highest authority: user instruction, PDR, ADR, project constitution, dev_graph node, source document, code, or tool output?
2. How should conflicts be resolved?
3. Can Claude Code override an ADR?
4. Can Hermes rewrite the dev_graph automatically?
5. Can CodeGraph contradict the dev_graph?
6. What happens when CodeGraph shows that code truth differs from the dev_graph?
7. Which graph mutations are automatic, staged, or human-review-required?
8. Can Hermes memory override the dev_graph, an ADR, or current code truth?
9. Can a dream-cycle recommendation update memory, skills, crons, or project state automatically?
10. What is the authority status of dashboard state, Kanban state, artifacts, and past conversation summaries?
11. What should happen when a retrieved memory conflicts with a canonical project artifact?

Recommended starting hierarchy:

1. Explicit current user instruction, unless unsafe.
2. Safety constraints and denylisted operations.
3. Project constitution / CLAUDE.md / AGENTS.md / Hermes profile constitution.
4. Active PDRs and ADRs.
5. Canonical dev_graph nodes passing admissibility checks.
6. Current code truth from filesystem/Git/CodeGraph.
7. External documentation retrieved through permitted docs MCPs.
8. Approved Hermes memory and SOUL files.
9. Dashboard/Kanban/artifact metadata.
10. Agent-generated summaries and dream-cycle suggestions.
11. Speculative or deprecated notes.

The dev_graph is canonical for engineering meaning. CodeGraph is canonical only for derived code topology. Hermes memory is a personalization and operating-context layer, not an authority layer for engineering truth. Dreaming may propose changes, but it must not silently mutate canonical design, code, graph, skills, or cost policies.

---

## Phase 3 — Ontology-Grounded RAG Control Layer

Interrogate whether ontology-grounded RAG is truly integrated.

Minimum questions:

1. Is ontology-grounded RAG a passive knowledge base or an active control layer?
2. Which execution decisions should be grounded in ontology nodes?
3. Which rules must be represented as constraints, gates, predicates, schemas, or ADRs?
4. Which context-pack assembly steps are mandatory before Claude Code acts?
5. What is the admissibility standard for nodes entering a coding context pack?
6. Which ontology violations block execution?
7. How are graph updates proposed, validated, approved, and synced?
8. How do Obsidian, Smart Connections, Dataview, Neo4j, CodeGraph, Context7, Hermes memory, and session history divide responsibility?
9. Should dream-cycle insights become dev_graph nodes, Obsidian notes, ADR candidates, or merely daily suggestions?
10. How are cross-agent data-lake insights linked back to canonical ontology nodes?
11. How does the system prevent memory summaries, dreams, and dashboard artifacts from polluting canonical graph truth?

Recommended starting position:

Ontology-grounded RAG is the semantic control plane. It grounds, constrains, validates, and updates looped automation. It is not merely retrieval. Every non-trivial Claude Code task must receive a typed execution packet assembled from canonical dev_graph nodes, graph traversal, current code truth, permitted API docs, tests, constraints, gates, acceptance criteria, and relevant but explicitly lower-authority Hermes memory.

Dream-cycle output should create `Suggestion`, `Risk`, `OpenDecision`, `SkillCandidate`, or `CronCandidate` artifacts first. It should not directly mutate canonical ontology nodes or ADRs.

---

## Phase 4 — Hermes Responsibility Boundary

Interrogate Hermes’ role.

Minimum questions:

1. Should Hermes directly drive an open Claude Code terminal?
2. Should Hermes create GitHub issues and let Claude Code Action create PRs?
3. Should Hermes call headless `claude -p` jobs?
4. Should Hermes host LangGraph-style durable workflows?
5. Which commands should Hermes expose?
6. Which recurring jobs should Hermes schedule?
7. What should Hermes remember?
8. What should Hermes never store?
9. How should Hermes handle failed jobs?
10. Should Hermes act mainly through Telegram/mobile, dashboard, terminal, or all of them?
11. Which tasks should Hermes run as full agentic loops and which should run as script-only/no-agent workflows?
12. How should Hermes use `context_from`, `work_dir`, or equivalent job-linking/work-directory mechanisms?
13. Should Hermes create new crons from inside cron sessions, or should cron creation always require explicit user/session approval?
14. Should Hermes be allowed to create or update its own skills automatically after successful workflows?
15. What does Hermes do when it does not know how to use a tool: ask the user, inspect docs, create a skill, or stage a repo-integration task?

Recommended starting position:

Hermes should not “chat” Claude Code into vague work. Hermes should generate typed job manifests, schedule loops, collect source manifests, route models, monitor budgets, open issues/PRs, run audits, and summarize results. Implementation should happen through PR-based Claude Code Action or controlled headless Claude Code runs.

Hermes can use mobile/Telegram or a dashboard as a command surface, but the operating truth must be in files, manifests, artifacts, and auditable job logs.

Hermes crons should run as fresh isolated sessions with self-contained prompts. Script-only jobs should be preferred for deterministic checks such as linting, cost reports, dashboard refresh, source hash verification, and graph health metrics.

Target commands:

```bash
hermes rag new <project> \
  --blueprint karpathy_llm_wiki \
  --sources ./sources \
  --ontology ontology_first \
  --target obsidian,neo4j,qdrant \
  --budget 5

hermes rag audit <project> \
  --grill \
  --eval \
  --graph-health \
  --cost-report

hermes rag refresh <project> \
  --only-new-sources \
  --open-pr

hermes claude spawn <repo> \
  --job jobs/<job>.yaml \
  --mode github-pr \
  --max-cost 3

hermes dream run \
  --scope hermes,claude,obsidian,dev_graph,costs \
  --output artifacts/dreams/<date>.md \
  --no-writeback

hermes os dashboard refresh \
  --connections --models --skills --crons --costs --artifacts
```

---

## Phase 5 — Hermes Five Pillars and Native Operating Model

Interrogate Hermes as Hermes, not only as a wrapper around Claude Code.

Minimum questions:

1. What is the required memory model?
2. What belongs in `USER.md`?
3. What belongs in `MEMORY.md`?
4. What belongs in `SOUL.md`?
5. What belongs in `AGENTS.md`, `CLAUDE.md`, or project-local context files?
6. What should be stored in searchable session history rather than always-loaded memory?
7. What should become a skill?
8. Which skills may self-update?
9. Which skills require human review before update?
10. Which crons are agentic and which are deterministic/script-only?
11. What feedback loop turns real work into better memory, better skills, and better operating behavior?
12. How do we prevent memory bloat, skill bloat, cron bloat, and tool bloat?

Recommended starting position:

Hermes should be designed around five native pillars:

1. **Memory** — durable but small user/project/environment context. Store stable preferences, operating constraints, active project facts, and recurring workflow context. Do not store secrets, API keys, or temporary task status.
2. **Skills** — procedural memory. Every recurring workflow should become a `SKILL.md` with YAML metadata, progressive disclosure, acceptance gates, and a testable output contract.
3. **SOUL** — personality and role framing. SOUL should shape interaction style and operating stance, but it must not override safety, project constitutions, ADRs, or dev_graph constraints.
4. **Crons** — proactive scheduled automation. Crons turn Hermes from reactive to proactive, but must be self-contained, bounded, logged, budgeted, and non-recursive.
5. **Self-improving loop** — useful experience becomes memory, searchable history, improved skills, and proposed operating-system changes.

The design must explicitly prevent “one mega-agent with all tools, all keys, all memories, and all crons.” Scale through bounded roles, skill packages, memory segmentation, and clear agent reach.

---

## Phase 6 — Hermes Memory, SOUL, Honcho, and Context Curation

Interrogate memory governance.

Minimum questions:

1. What exact information should Hermes remember about the user, projects, tools, preferences, and operating environment?
2. What information should remain in session history but not enter always-loaded memory?
3. What information is prohibited from memory?
4. Should Hermes use bounded memory files with hard size limits?
5. Should Hermes periodically run a background memory-curation check during long sessions?
6. Should Hermes use an external memory layer such as Honcho or a peer-card service?
7. If Honcho-like memory is used, what data may it receive?
8. Can Honcho-like inference become authoritative, or is it only personalization context?
9. What memory-diff review process is required?
10. Should there be a memory lint/audit harness?
11. How are inaccurate memories corrected or deprecated?
12. How is sensitive personal or institutional information kept out of memory?

Recommended starting position:

Hermes memory should be deliberately small and curated. Use always-loaded memory only for stable, high-value operating context. Use session search for older detail. Do not store secrets, raw credentials, transient task state, confidential institutional data, or speculative psychological profiling.

A Honcho-like peer-memory layer may be evaluated later, but it should not be part of v1 unless its data boundary, privacy posture, retention policy, and override rules are explicit.

Required memory artifacts:

```text
.hermes/
  SOUL.md              # role/persona/interaction stance
  memories/
    USER.md            # user preferences, stable operating preferences
    MEMORY.md          # environment, projects, tool locations, recurring workflow context
  sessions/            # searchable history, not always-loaded authority
  memory_diffs/        # proposed memory updates for review
```

Memory update policy:

- Automatic memory proposals are allowed.
- Silent memory mutation is allowed only for low-risk stable preferences if the user has already authorized that behavior.
- Sensitive, institutional, project-governance, credential, or architectural memory updates require review.
- Dream-cycle memory suggestions are proposals, not facts.

---

## Phase 7 — Dreaming Function and Reflective Operating Loop

Interrogate the dream cycle.

Minimum questions:

1. What does “dreaming” mean operationally?
2. Which sources may the dream cycle inspect: Hermes conversations, Claude Code logs, ChatGPT/Gemini/Grok exports, Obsidian notes, GitHub activity, cost ledger, skill usage, cron history, dev_graph changes?
3. Which sources are prohibited?
4. What is the dream cycle allowed to output?
5. Can it update memory, skills, crons, goals, cost plans, or dev_graph nodes?
6. What is the evidence standard for dream-cycle claims?
7. How should dreams distinguish fact, inference, pattern, risk, recommendation, and speculative idea?
8. How should dreams identify unused skills, stale skills, missing skills, repeated friction, cost waste, and workflow bottlenecks?
9. What cadence should dreams run on?
10. How are dream outputs reviewed?
11. What blocks a dream recommendation from becoming an action?
12. What metrics determine whether dreaming is useful?

Recommended starting position:

Dreaming is a scheduled reflective analysis loop, not an autonomous execution loop. It should inspect approved logs and artifacts to produce a short daily or weekly brief:

```text
Dream Brief
- What changed?
- What repeated friction appeared?
- Which skills were used?
- Which useful skills were not used?
- Which crons succeeded, failed, or wasted cost?
- Which costs look anomalous?
- Which project goals advanced or stalled?
- Which memory updates are proposed?
- Which skill updates are proposed?
- Which graph/governance questions should be reviewed?
- Which action is recommended next?
```

Dreaming may propose:

- memory deltas;
- skill candidates;
- cron candidates;
- cost-plan changes;
- artifact cleanup;
- dashboard warnings;
- open decisions;
- Grill Me questions;
- PDR/ADR candidates.

Dreaming must not directly:

- edit code;
- merge PRs;
- write canonical dev_graph nodes;
- change ADR/PDR status;
- send external messages;
- create new crons recursively;
- alter credentials or tool permissions;
- silently change model-routing or budget policies.

---

## Phase 8 — Agentic OS Dashboard, Mission Control, Pantheon, and Artifact Vault

Interrogate the visual intelligence layer.

Minimum questions:

1. Does the OS need a visual dashboard in v1?
2. Which views are essential: connections, models, memory, skills, crons, costs, artifacts, goals, Kanban, logs, graph health, PR status?
3. How should Mission Control represent midterm goals?
4. How should it split actions between Hermes, Claude Code, and the human operator?
5. How should Pantheon represent personas, skills, auxiliary models, and preferred model assignments?
6. How should the Artifact Vault store generated reports, prompts, PDFs, dashboards, documents, code artifacts, eval reports, dream briefs, and PR summaries?
7. What counts as an artifact?
8. How are artifacts versioned and linked to jobs, costs, sources, and graph nodes?
9. How does the dashboard avoid becoming a second, conflicting source of truth?
10. Should the dashboard include an ROI/time-saved view?
11. Should it include live cost, context-window usage, and model spend by provider?
12. Should it expose buttons that trigger jobs, or should it be read-only in v1?

Recommended starting position:

Build a minimal read-mostly dashboard for v1. Its purpose is observability and review, not uncontrolled execution.

Required v1 dashboard panels:

- **Connections** — which systems Hermes can access.
- **Model Registry** — configured models, model classes, provider, cost tier, permitted task types.
- **Memory Review** — `USER.md`, `MEMORY.md`, `SOUL.md`, proposed memory diffs.
- **Skills/Pantheon** — installed skills, owners, version, preferred model, last used, success/failure rate.
- **Crons** — schedule, scope, cost, last run, next run, failure state.
- **Mission Control** — goals, action split, current blockers, next action.
- **Artifact Vault** — generated outputs, eval reports, dream briefs, PR summaries, graph deltas.
- **Cost and ROI** — spend by model/provider/task; estimated time saved; cost anomalies.
- **Graph Health** — dev_graph/Obsidian/Neo4j status.
- **Claude Code Jobs** — queued/running/completed jobs, PR links, harness status.

Dashboard state is derivative. Canonical truth remains in repos, manifests, dev_graph, cost ledgers, and PDR/ADR files.

---

## Phase 9 — Hermes Levels and Promotion Model

Interrogate the maturity ladder.

Minimum questions:

1. Which Hermes level are we designing for now?
2. Which level is unsafe before the harnesses exist?
3. What must be true before moving from one level to the next?
4. Should the OS support Level 6 asynchronous building before Level 5 orchestration is reliable?
5. What evidence proves that a level is achieved?
6. What level should the RAG Factory v1 target?
7. What level should be explicitly forbidden in the first implementation?

Use this maturity model:

- **Level 0 — Non-user / no operating system**: no meaningful Hermes use.
- **Level 1 — Beginner**: installed Hermes, connected to a messaging platform, uses simple one-shot tool tasks.
- **Level 2 — Apprentice**: Hermes knows the user and operating context through curated memory and SOUL.
- **Level 3 — Operator**: uses commands, skills, model routing, background tasks, handoff/clear/steer patterns, and cost-aware model selection.
- **Level 4 — Integrator**: Hermes has controlled access to real-world tools such as GitHub, Obsidian, calendar, email drafts, browser, files, and project data.
- **Level 5 — Orchestrator**: Hermes manages multiple agents/personas/models in parallel under explicit roles and budgets.
- **Level 6 — Builder**: Hermes can ship real artifacts asynchronously, including software/report/dashboard outputs, but only with gates.
- **Level 7 — Agentic Power User / Unified AI OS**: one operating system unifies Hermes, Claude Code, Obsidian, external models, cost ledgers, artifacts, dreams, and cross-agent memory.

Recommended starting position:

The RAG Factory should target **Level 4/G2/L1-L2** first:

- Level 4 Hermes integration: controlled access to tools and project data.
- G2 graph grounding: ontology + constitution grounding.
- L1/L2 automation: report-only and assisted fixes, not unattended autonomy.

Level 5 orchestration, Level 6 asynchronous building, and Level 7 unified AI OS should be roadmap targets gated by harness evidence.

---

## Phase 10 — Hermes Commands, Background Tasks, and Interaction Controls

Interrogate operational controls.

Minimum questions:

1. Which Hermes commands must be supported?
2. Which commands are safe during long-running jobs?
3. How should `/steer` modify an in-flight task?
4. How should `/background` tasks be scoped and budgeted?
5. What does `/handoff` mean: to another Hermes agent, to Claude Code, to a human, or to a model/persona?
6. What does `/clear` reset: current session, context, queued state, or UI view?
7. How are background tasks prevented from drifting or duplicating work?
8. How are background tasks represented in the dashboard/Kanban?
9. Can background jobs modify files, memory, or crons?
10. How does the system preserve auditable state across mobile, dashboard, and terminal sessions?

Recommended starting position:

Interaction controls should be admitted only if they map to auditable job states:

- `/steer` may add guidance to the active job log but must not silently alter safety or budget constraints.
- `/background` creates a separate bounded job with its own budget, status, and output artifact.
- `/handoff` creates a typed handoff packet to Claude Code, another Hermes persona, another model, or the human operator.
- `/clear` resets conversational context but must not delete canonical logs, artifacts, or job state.

Every background/handoff job must have:

- title;
- owner;
- model policy;
- tool policy;
- cost ceiling;
- output artifact path;
- completion condition;
- cancellation rule.

---

## Phase 11 — Hermes Agent Reach and Segmentation

Interrogate the scope of access.

Minimum questions:

1. What systems may Hermes access?
2. Which systems are read-only?
3. Which systems allow writes?
4. Which systems require human approval for writes?
5. Which credentials are exposed to Hermes, if any?
6. Should one Hermes agent have all capabilities, or should agents be segmented?
7. When should a new Hermes agent be created?
8. Should agents be segmented by domain, audience, credential set, schedule, or memory boundary?
9. How do multiple Hermes agents coordinate without becoming confusing?
10. Which agent is the “main operator” or “COO”?
11. How are multi-agent tasks represented in Mission Control and Kanban?
12. How do we avoid one mega-agent with all API keys and too much context?

Recommended starting position:

Use one primary Hermes operator initially. Split into another Hermes agent only when a task requires its own:

- memory boundary;
- credentials;
- schedule;
- audience;
- tool reach;
- risk profile;
- project domain;
- dashboard/notification channel.

For v1, avoid multiple Hermes agents unless separation is necessary. Use Claude Code subagents inside coding jobs and Hermes personas/models inside controlled orchestration, but do not create separate full Hermes agents prematurely.

Tool reach matrix:

```text
System                Default      Notes
GitHub                read/write   PR/issues allowed; protected branch writes denied
Obsidian vault        read/write   dev_graph rules apply; raw/wiki boundaries respected
Neo4j                 read-only    markdown/dev_graph remains canonical
CodeGraph             read-only    derived code topology only
Postgres/DuckDB       limited rw   job state, manifests, evals, cost ledger
Email                 draft-only   no sending in v1
Calendar              create/edit with approval rules
Browser/Firecrawl     bounded      source acquisition only, provenance required
Filesystem            repo-scoped  no secrets, no home-directory broad access
Claude Code           via job packet / PR / headless JSON
Model providers       routed       cost and privacy policy required
Cost data             read-only    unless approved budget config change
Dashboard             derivative   not canonical truth
```

---

## Phase 12 — Claude Code Core Stack

Interrogate the Claude Code-first layer.

Minimum questions:

1. What belongs in `CLAUDE.md`?
2. What belongs in `.claude/skills/`?
3. What belongs in `.claude/agents/`?
4. What belongs in hooks?
5. What belongs in MCP?
6. What belongs in scripts/tests instead of prompts?
7. How do we avoid overloading Claude Code context?
8. Which capabilities should be built first?
9. How does Claude Code emit artifacts back to the Hermes Artifact Vault?
10. How are Claude Code job outputs represented in Mission Control and Kanban?

Recommended starting position:

`CLAUDE.md` should be short and constitutional. Long procedures belong in skills. Specialist reasoning belongs in subagents. Deterministic enforcement belongs in hooks/scripts. External data/tool access belongs in MCP. Code topology belongs in CodeGraph. Governance belongs in dev_graph. Claude Code job summaries, diffs, eval results, and limitations should be published as artifacts for Hermes to ingest and display.

First skills:

- `ponytail-diff`
- `repo-hunter`
- `repo-triage`
- `mcp-candidate-audit`
- `source-manifest-build`
- `ontology-draft`
- `ontology-shacl-check`
- `obsidian-graph-health`
- `neo4j-schema-sync`
- `qdrant-reindex`
- `rag-eval-run`
- `citation-audit`
- `cost-report`
- `grill-rag-design`
- `grill-devops`
- `graph-writeback`
- `dream-brief-review`
- `artifact-publish`

First subagents:

- `repo-archaeologist`
- `minimal-diff-engineer`
- `test-engineer`
- `devops-engineer`
- `security-auditor`
- `mcp-auditor`
- `ontology-architect`
- `obsidian-librarian`
- `retrieval-engineer`
- `eval-engineer`
- `cost-auditor`
- `artifact-librarian`

---

## Phase 13 — CodeGraph Integration

Interrogate CodeGraph adoption.

Minimum questions:

1. Does CodeGraph replace the dev_graph?
2. What evidence does CodeGraph provide?
3. What evidence can CodeGraph not provide?
4. How should CodeGraph results enter a context pack?
5. When should CodeGraph be queried?
6. What happens if CodeGraph is stale?
7. Should function-level information be modeled in dev_graph or left to CodeGraph?
8. How should changed files and affected tests be discovered?
9. How does CodeGraph evidence appear in the dashboard or artifact reports?
10. How should CodeGraph interact with Claude Code job packets?

Recommended starting position:

Adopt CodeGraph as a live code-topology adapter. It should provide symbols, call paths, dependencies, impact radius, route-handler links, affected tests, and source snippets. It should not own architecture decisions, constraints, ontology semantics, graph mutation approval, or canonical engineering meaning.

---

## Phase 14 — MCP, Plugins, LSP, and Tool Admission

Interrogate tool sprawl.

Minimum questions:

1. Which MCP servers are essential for version 1?
2. Which MCP servers are delayed?
3. What is the admission policy for a new MCP server?
4. What permissions should each MCP receive?
5. Which tools are read-only?
6. Which tools can write?
7. Which writes require human review?
8. How many tools should be exposed to a single agent context?
9. How do plugins differ from skills and MCPs?
10. Which tools should be visible in the dashboard as part of agent reach?
11. What is the minimal tool set for the dream cycle?
12. What is the minimal tool set for the RAG factory?
13. Which tools are forbidden from background jobs and crons?

Recommended starting position:

Core MCPs:

- filesystem / MCP Vault
- Smart Connections
- Neo4j read-only
- Postgres read/write only for job/eval state where safe
- GitHub
- Context7
- Playwright
- Firecrawl or another source-harvesting tool, but not every search tool at once
- CodeGraph

Delay arbitrary community MCP bundles, production cloud-admin MCPs, billing/payment/admin MCPs, and broad shell-control MCPs.

Every MCP must have:

- purpose;
- owner;
- credential boundary;
- allowed operations;
- denied operations;
- data exposure risk;
- minimal integration test;
- dashboard visibility;
- rollback plan.

---

## Phase 15 — Persona, Pantheon, Auxiliary Models, and Model Routing

Interrogate model/persona assignment.

Minimum questions:

1. Which personas are needed?
2. Which persona owns which job type?
3. Which model should each persona prefer?
4. Which models are used for cheap research, critique, implementation, auditing, dreaming, and delegation?
5. Should Hermes use auxiliary models for research or delegation while a stronger model performs oversight?
6. Can personas create or edit skills?
7. Can personas run crons?
8. How should the dashboard show persona/model usage?
9. What happens if a model is unavailable, too expensive, or fails quality gates?
10. Which providers are allowed for institutional or sensitive data?
11. Which tasks can use subscription/OAuth models and which require API/audited billing?
12. How do privacy, cost, latency, and quality trade off in the routing policy?

Recommended starting position:

Use a model-agnostic routing strategy:

- Cheap/local models: classification, deduplication, metadata extraction, simple summaries, dashboard refresh.
- Mid-tier models: source synthesis, skill drafting, background research, first-pass ontology candidates.
- Strong coding models: Claude Code implementation, difficult refactors, architecture-sensitive changes.
- Strong reasoning models: final architecture review, security review, governance review, PDR/ADR validation.
- Auxiliary models: research/delegation/critique roles where cost and isolation matter.
- Dream-cycle model: cheap or mid-tier by default, strong model only for monthly strategy review.

Pantheon should map persona → job → description → system prompt → preferred model → allowed tools → budget ceiling → output contract.

Example personas:

```text
Athena     architecture / governance / ADR review      strong reasoning model
Mercury    crons / autopilot / scheduling              cheap fast model
Hephaestus implementation / Claude Code handoff        Claude Code / coding model
Hermes     routing / synthesis / mobile interaction    balanced model
Themis     safety / compliance / gate review           strong audit model
Mnemosyne  memory / dream / artifact curation          cheap-mid model, read-only by default
```

---

## Phase 16 — Repository and Environment Discipline

Interrogate the repo structure.

Minimum questions:

1. Should this be one repo or multiple repos?
2. What is the minimal repo set?
3. Which repo is canonical for skills?
4. Which repo is canonical for blueprints?
5. Which repo is canonical for evaluation?
6. How are generated artifacts separated from source artifacts?
7. How are Obsidian vault, dev_graph, raw sources, normalized sources, code, Hermes memory, and dashboard data separated?
8. What must be reproducible with one command?
9. Where does the Artifact Vault live?
10. Where do dream briefs live?
11. How are dashboard state and Kanban state versioned?
12. Should Hermes run locally, on a VPS, in Docker, or both?
13. What is the backup and restore plan for Hermes memory, skills, crons, artifacts, and dashboard state?

Recommended starting position:

Use a small multi-repo architecture:

1. `hermes-rag-factory-profile`
2. `claude-rag-factory-template`
3. `rag-blueprints`
4. `rag-eval-harness`
5. project-specific generated RAG repos
6. `hermes-os-dashboard` or dashboard module, if not bundled with the profile

Do not collapse everything into one mega-repo unless maintenance pressure proves it necessary.

Base tooling:

- GitHub
- Git worktrees
- Docker Compose
- uv
- pytest
- Ruff
- Pyright or mypy
- pre-commit
- Gitleaks
- Trivy
- Semgrep
- DuckDB
- Postgres
- Neo4j
- Qdrant

Suggested artifact layout:

```text
artifacts/
  dreams/
  reports/
  evals/
  costs/
  pr_summaries/
  graph_deltas/
  dashboards/
  generated_docs/
```

---

## Phase 17 — RAG Factory Blueprint

Interrogate the actual RAG workflow.

Minimum questions:

1. What is the source manifest schema?
2. What counts as an accepted source?
3. What extraction methods are allowed?
4. How are source chunks versioned?
5. How are claims linked to sources?
6. What ontology classes and relations are mandatory?
7. What SHACL or schema checks block progress?
8. How are Obsidian nodes generated?
9. How are Neo4j and Qdrant indexes built?
10. What retrieval recipes are benchmarked?
11. What answer-evaluation rules block acceptance?
12. How are RAG artifacts published to the dashboard?
13. How do dream cycles detect stale sources, underused skills, weak retrieval, or rising costs?

Recommended starting workflow:

1. Grill and scope.
2. Build source manifest.
3. Normalize sources.
4. Extract claims/entities/relations.
5. Draft ontology.
6. Validate ontology.
7. Generate Obsidian nodes.
8. Load Neo4j graph.
9. Build Qdrant hybrid index.
10. Run retrieval evals.
11. Run answer/citation evals.
12. Publish artifacts to Artifact Vault.
13. Produce PR, report, cost ledger, graph delta, and limitations.
14. Dream cycle reviews run history and proposes improvements.

---

## Phase 18 — Reliability Harnesses

Interrogate acceptance gates.

Minimum questions:

1. Which harnesses are mandatory before automation?
2. Which harnesses are advisory?
3. What blocks PR creation?
4. What blocks merge?
5. What blocks graph writeback?
6. What blocks L2 or L3 loop promotion?
7. What blocks Hermes Level 5/6/7 promotion?
8. What metrics are tracked over time?
9. Which dream-cycle outputs require verification before action?
10. Which dashboard alerts are blocking?

Recommended harnesses:

A. Source harness:

- stable source ID
- checksum
- provenance
- extraction method
- chunk count
- rejected-source reason

B. Ontology harness:

- valid schema
- SHACL pass
- no duplicate class IDs
- no dangling relation types
- every claim linked to source chunks

C. Wiki/dev_graph harness:

- valid YAML/frontmatter
- unique canonical IDs
- valid wikilinks
- no unjustified orphan nodes
- no deprecated authoritative nodes
- Dataview consistency

D. Graph harness:

- Neo4j constraints installed
- expected node/edge counts
- no invalid edge types
- no duplicate canonical IDs
- expected traversal fixtures pass

E. Retrieval harness:

- golden questions
- expected chunks
- Recall@5
- MRR
- graph expansion lift
- reranker lift

F. Answer harness:

- citation precision
- citation recall
- faithfulness
- refusal correctness
- hallucinated source IDs = 0

G. Agent harness:

- no forbidden file edits
- no secrets in diff
- tests pass
- lint passes
- typecheck passes
- cost below budget
- max turns respected
- PR summary includes limitations

H. Hermes-native harness:

- memory diffs are reviewable
- no secrets in memory
- cron prompts are self-contained
- no recursive cron creation
- background jobs have budgets
- dream briefs separate fact/inference/recommendation
- dashboard state is derivative
- skill updates are versioned
- tool reach matches policy
- artifact vault links outputs to jobs

---

## Phase 19 — Model Routing and Cost Control

Interrogate model economics.

Minimum questions:

1. Which tasks require frontier models?
2. Which tasks can use small/local models?
3. Which tasks should be deterministic and model-free?
4. How is cost estimated before a loop runs?
5. How is cost recorded after a run?
6. What is the per-job cost ceiling?
7. What is the daily/weekly loop budget?
8. When should a job stop early?
9. How are embeddings and rerankers benchmarked?
10. How does the dashboard show cost by provider, model, task, persona, skill, and cron?
11. Can the dream cycle recommend plan/model downgrades?
12. Who approves budget changes?

Recommended starting policy:

Use cheap/local models for classification, metadata extraction, deduplication, chunk labeling, simple summaries, dashboard refresh, and routine dream-cycle briefs. Use stronger models for ontology design, final architecture review, security review, and implementation tasks. Use deterministic scripts before model calls wherever possible. Do not let a frontier model inspect work that already fails schema validation, linting, graph checks, or tests.

Every job must have:

- max cost;
- max turns;
- allowed model class;
- allowed tools;
- expected output schema;
- cache policy;
- early-stop rules;
- dashboard-visible spend classification.

---

## Phase 20 — External Repo Adoption

Interrogate external tool integration.

Minimum questions:

1. Does the repo solve an actual unsolved problem?
2. Is it library, CLI, MCP, plugin, template, or agent runtime?
3. Does it overlap with Hermes, Claude Code, dev_graph, CodeGraph, or the dashboard?
4. Is it maintained?
5. What is the license?
6. Does it run arbitrary code?
7. Does it require credentials?
8. Can it be sandboxed?
9. What is the smallest integration?
10. What test proves it works?
11. What is the rollback plan?
12. Would this tool increase or reduce context/tool bloat?
13. Should it be a Hermes skill, Claude Code skill, MCP, dashboard panel, script, or external service?

Recommended starting decisions:

Adopt immediately:

- Ponytail as a Claude Code coding-discipline skill/rule.
- CodeGraph as code-topology MCP.
- Context7 for current API docs.
- GitHub MCP for issues/PRs/repo automation.
- Neo4j/Postgres/Smart Connections/MCP Vault for graph and vault workflows.
- Ragas, DeepEval or promptfoo, and Phoenix for evaluation/tracing.
- LiteLLM or equivalent cost ledger/router only after the first local harness works.

Track but delay:

- DeerFlow as future comparison/sidecar agent harness.
- Cursor as optional secondary IDE/review surface.
- Honcho-like peer memory until privacy, authority, and retention rules are clear.
- broad MCP registries.
- production cloud-admin MCPs.
- arbitrary autonomous agent runtimes.

---

## Phase 21 — Loop Engineering and Promotion Model

Interrogate operating loops.

Minimum questions:

1. Which loops are L1 report-only?
2. Which loops can become L2 assisted-fix loops?
3. Which loops may eventually become L3 unattended?
4. What is the graph-grounding maturity level of each loop?
5. What Hermes level is required for each loop?
6. What state files are required?
7. What budget files are required?
8. What verifier runs after each loop?
9. What conditions pause or kill a loop?
10. Which loops may emit dream-cycle recommendations?
11. Which loops may update skills or memory?
12. Which loops may update dashboard/Kanban state?

Recommended model:

Use three axes:

Automation level:

- L1 = report-only
- L2 = assisted fixes with human review
- L3 = unattended within strict constraints

Graph-grounding level:

- G0 = no graph grounding
- G1 = retrieval-only
- G2 = ontology + constitution grounding
- G3 = ontology-validated execution
- G4 = controlled graph-updating loop

Hermes maturity level:

- H1 = one-shot tool use
- H2 = curated memory/SOUL
- H3 = skills, commands, model routing
- H4 = controlled integrations
- H5 = multi-agent orchestration
- H6 = asynchronous building
- H7 = unified AI operating system

Do not promote a loop to L2/L3, G3/G4, or H5/H6/H7 unless it has budget, run log, state, verifier, rollback, forbidden-path policy, graph admissibility checks, memory governance, cron governance, artifact capture, dashboard visibility, and human gates.

---

## Phase 22 — Final Output Contract

After the interrogation, produce:

1. System mission.
2. In-scope workflows.
3. Out-of-scope workflows.
4. Responsibility matrix:
   - Hermes
   - Claude Code
   - dev_graph
   - CodeGraph
   - MCPs
   - dashboard
   - dream cycle
   - artifact vault
   - harnesses
   - human operator
5. Authority hierarchy.
6. Hermes five-pillar policy.
7. Memory/SOUL/session-history policy.
8. Dream-cycle policy.
9. Agent reach and tool permission matrix.
10. Multi-agent segmentation policy.
11. Dashboard / Mission Control / Pantheon / Artifact Vault design.
12. Minimal repo architecture.
13. Minimal command interface.
14. First Hermes skills.
15. First Claude Code skills.
16. First Claude Code subagents.
17. First hooks.
18. First MCPs.
19. First harnesses.
20. Model-routing table.
21. Cost-control table.
22. L1/L2/L3, G0/G1/G2/G3/G4, and H1-H7 promotion policy.
23. External repo adoption table.
24. PDR/ADR list with status.
25. Implementation roadmap.
26. Risks and mitigations.
27. Open decisions.
28. Tool Catalogue Coverage Matrix:
    - Tool / item
    - Catalogue category
    - Proposed status
    - Adopt / defer / reject / benchmark
    - Architectural layer
    - Risk level
    - Required admission review
    - Required benchmark or harness
    - Related ADR/PDR

Do not end with vague advice. End with a concrete “build first” recommendation and the smallest next implementation step.

---

## Recommended “Build First” Target

Build the smallest system that proves the whole design loop:

```text
Hermes command
  → typed job manifest
  → dev_graph admissibility check
  → CodeGraph code-topology context
  → Claude Code PR/headless job
  → eval/harness results
  → artifact publication
  → dashboard update
  → dream-cycle suggestion
  → human-approved memory/skill/graph delta
```

Minimal first deliverable:

```text
hermes rag audit <project> --graph-health --cost-report --dream-brief --no-writeback
```

This should produce:

- graph-health report;
- cost report;
- relevant dev_graph context pack;
- CodeGraph impact summary;
- Artifact Vault entry;
- dashboard refresh;
- dream brief with suggestions only;
- no code edits;
- no graph mutation;
- no memory mutation without review.

