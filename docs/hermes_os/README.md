# Hermes OS

A Claude-assisted operating system that combines **Hermes** (persistent orchestration) with
**Claude Code** (repo-local implementation), governed by an ontology-grounded engineering graph.

This repository is the **governance home**: the design record, decisions, and roadmap that every
other repo in the system answers to. It holds documents, not the running system.

> **v1 mission — the RAG Factory.** Hermes-operated automation that constructs, audits, refreshes,
> and benchmarks ontology-grounded RAG projects. A general personal AI OS is a roadmap goal
> (Level 7), not a v1 goal. Every scope dispute defaults to: *does it make the factory safer or
> more observable?*

## The core idea

Two roles, kept strictly separate:

- **Hermes** — the persistent controller: scheduler, memory layer, model router, job supervisor,
  and messaging surface. It plans and dispatches typed jobs. It never implements.
- **Claude Code** — the repo-local implementation and verification engine. It executes enveloped
  jobs and produces PRs. It never orchestrates.

Both are held to an **ontology-grounded engineering graph** (`dev_graph`) that is the semantic
authority for what context, constraints, and decisions are admissible. Disagreement between graph
*intent* and code *reality* is treated as **Drift** — a blocking defect to surface, never a
conflict either side silently wins.

## Key concepts

| Term | Meaning |
|---|---|
| **dev_graph** | Canonical, ontology-governed engineering graph — the authority for admissible context, constraints, gates, and decisions. |
| **CodeGraph** | Derived, AST-based code-topology index (symbols, call paths, impact radius). Never canonical. |
| **Context Pack** | A typed, admissibility-checked bundle assembled for one Claude Code task. No pack → no dispatch. |
| **Job Envelope** | The mandatory per-job contract: title, owner, model policy, tool policy, cost ceiling, output path, completion + cancellation rules. No envelope → no dispatch. |
| **Harness** | One of the eight named blocking gate sets (source, ontology, wiki, graph, retrieval, answer, agent, Hermes-native) that verify work before it lands. |
| **Artifact Vault** | The versioned `artifacts/` tree where every job's outputs persist, linked to jobs and costs. |
| **Open Decision** | A surfaced, unresolved conflict recorded as an artifact; blocks affected work until a human resolves it. |

Full glossary: [`CONTEXT.md`](CONTEXT.md).

## Command interface (v1)

```
hermes rag new <project> --blueprint <name> --sources ./sources --budget 5
hermes rag audit <project> --graph-health --cost-report --dream-brief --no-writeback
hermes rag refresh <project> --only-new-sources --open-pr
hermes claude spawn <repo> --job jobs/<job>.yaml --mode worktree-pr --max-cost 3
hermes dream run --scope per-D-010 --output artifacts/dreams/<date>.md --no-writeback
hermes os dashboard refresh
```

Every dispatched job carries an envelope and a context pack, bills against a cost ceiling
(kill-at-ceiling, weekly hard stop), and lands its outputs in the Artifact Vault. Mutations always
go through a PR — never a direct push.

## Guarantees

- **Zero silent writes** to memory, graph, or code. Every change is a reviewed diff → approval → PR.
- **Human operator approves** merges, writebacks, memory/skill/cron changes, budgets, and promotions.
- **Cost is bounded** per job and per period; alert at 80%, kill at ceiling, partial artifact kept.
- **v1 runs at H4 / G2 / L1–L2.** No unattended L3 loops, no multi-agent orchestration, no
  dream-cycle writebacks. Promotion requires ≥10 consecutive clean runs plus a signed ADR.

## Repository layout

```
CONTEXT.md            Glossary and design context (the ubiquitous language)
CLAUDE.md             Project instructions for agents working in this repo
docs/
  PDR-001-*.md        Product Decision Record — accepted v1 design
  adr/                ADR-0001..0021 — the decision record
  roadmap.md          Staged implementation plan (Waves 0–3)
  open-decisions.md   Residual unresolved decisions
  tool-coverage-matrix.md
  agents/             Issue-tracker, triage-label, and domain conventions
  operator/           Operator runbooks (e.g. WSL cheatsheet)
rag_blueprint/        Dev Graph Operations Manual — a specific binding spec
sources/              Source material
.scratch/             Local issue tracker (wave-0-foundation issues, grill decisions)
```

## Status

Design is **accepted** (PDR-001, 2026-07-05). Implementation is in **Wave 0 — Foundation**:

- ✅ Five repos scaffolded (private remotes)
- ✅ Docker/WSL2 Compose stack: Neo4j (read-only projection), Qdrant, Postgres, Phoenix
- ✅ Hermes profile skeleton (SOUL / USER / MEMORY caps, persona routing table, MCP set)
- ✅ Enforcement hooks (PreToolUse denylist, PostToolUse lint, Stop run-log)
- ⏳ Schemas + scripts, cost ledger, Telegram operator channel, admission reviews

See [`docs/roadmap.md`](docs/roadmap.md) for the full wave plan and the remaining Wave 0 items in
[`.scratch/wave-0-foundation/`](.scratch/wave-0-foundation/).

## Working in this repo

- **Issues** are tracked as local markdown files under `.scratch/<feature>/` — there is no remote
  issue tracker. See [`docs/agents/issue-tracker.md`](docs/agents/issue-tracker.md).
- **Decisions** are recorded as ADRs under `docs/adr/`. Read the relevant ADR before changing
  anything it governs.
- **Language** is enforced by the glossary in `CONTEXT.md` — use the canonical terms.
