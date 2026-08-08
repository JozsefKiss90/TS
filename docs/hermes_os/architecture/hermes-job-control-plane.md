# The Hermes Job Control Plane — From Job to Evidence

- **Status**: reference with proposed clarifications — created 2026-07-30 alongside course
  supplement 0006b (`TS` repo, `lessons/0006b-the-hermes-control-plane.html`)
- **Authority**: this document is **not** a new source of truth. Where it cites PDR-001, an ADR, a
  D-number, or a shipped Wave artifact, the citation is the authority. Where it introduces a name
  or structure of its own, the claim is labeled **proposed clarification** and binds nothing until
  ratified. On any conflict: PDR-001 / ADRs / `docs/open-decisions.md` win — fix this file.
- **Labels used**: **accepted** (grounded in PDR-001 / an ADR / a D-number) · **scaffolded**
  (repository structure or partial implementation exists — cited to a Wave issue) · **planned**
  (named in `docs/roadmap.md`) · **proposed clarification** (introduced here for coherence) ·
  **open decision** (unresolved; listed in `docs/open-decisions.md` or recommended below) ·
  **illustrative only** (example without normative force).

## 1. The v1 system boundary

> The Claude-Assisted Hermes Operating System is a governed job-execution system in which Hermes
> admits, grounds, plans, routes, supervises, and records work; Claude Code performs bounded
> repository implementation; deterministic services gather and verify evidence; and the human
> operator approves consequential change. *(proposed clarification — a one-sentence compression of
> PDR-001 §§1–3; the PDR's own mission sentence is the accepted form.)*

**Accepted (PDR-001 §1–2, D-001/D-002):** v1 is the **RAG Factory** — Hermes-operated automation
that constructs, audits, refreshes, and benchmarks ontology-grounded RAG projects. Six pillars in
scope: `rag audit` (report-only), `rag new`, `rag refresh` (PR-gated), `claude spawn` (L1/L2
only), the cost ledger + budget enforcement, and harness runs as blocking gates. Out of scope:
unattended L3 loops; email/calendar/social workflows; multi-Hermes orchestration (H5); dream-cycle
writebacks; UI beyond the read-only dashboard; external memory services; cross-agent data lake
(ADR-0016 stub). Every scope dispute defaults to *"does it make the factory safer or more
observable?"*

**Hermes is not the OS.** Hermes is one operating layer — the persistent controller (scheduling,
typed job manifests, model routing, budgets, notifications, job supervision, proposal drafting).
The OS is the whole governed system: Hermes **+** Claude Code **+** `dev_graph` (semantic
authority for intent) **+** CodeGraph (derived code-topology evidence) **+** harnesses **+** the
Artifact Vault **+** the trace surfaces **+** the human operator. (Accepted — PDR-001 §3
responsibility matrix.)

## 2. The unit of work: a Hermes job

**Accepted:** the unit Hermes dispatches is a governed job carrying two mandatory artifacts — a
**Job Envelope** and an admissibility-checked **Context Pack**. *No envelope → no dispatch; no
pack → no dispatch* (D-006, D-013, ADR-0002). Script-only (`--no-agent`) work is pack-exempt but
never envelope-exempt (ADR-0002/0012). A job is therefore **not** a prompt, a model request, a
Claude Code session, a cron invocation, a tool call, or a chat message — each of those may occur
*inside* a job, under the job's envelope.

**The Job Envelope — eight fields, accepted (D-013, ADR-0012; schema `rag_job.schema.json`,
Wave-0 issue 10):** title · owner · model policy · tool policy (`allowedTools`) · cost ceiling ·
output artifact path · completion condition · cancellation rule. The envelope is the operational
contract that *governs* execution; it does not itself contain context, evidence, state, or
results.

**The Context Pack — accepted (ADR-0002/0020):** a typed, admissibility-checked bundle of
canonical nodes, constraints, code truth, permitted docs, and acceptance criteria, assembled per
the blueprint's 8-step Assembly Protocol and passing the 9 admissibility checks; marked
`admitted: true`. Memory enters only as a labeled advisory block (ADR-0011); CodeGraph evidence
enters as a distinct derived-read-only section, downgraded to advisory if topology-stale
(ADR-0004).

**The full job structure (proposed clarification).** The accepted record defines the envelope,
the pack, the dispatch record + ledger row (on accept), the typed refusal (on reject), produced
artifacts, and terminal marking (`done` / `failed`). No single accepted schema yet composes them
into one job object. The composition this reference and supplement 0006b use:

```text
operator request
→ validated request (envelope schema-checked)          [accepted mechanism]
→ admitted Hermes job                                  [accepted mechanism]
    ├── Job Envelope        — accepted (8 fields)
    ├── Context Pack        — accepted (admitted: true)
    ├── current state       — proposed (see §4; ADR-0018 fixes only WHERE state lives)
    ├── execution plan      — proposed as a named part (v1 plans are largely static per job type)
    ├── budget state        — accepted as ledger rows (ADR-0007)
    ├── evidence            — accepted as artifacts + harness results (§7)
    ├── produced artifacts  — accepted (Artifact Vault, ADR-0013)
    ├── decision history    — partially accepted (run-log Stop hook; full history proposed)
    └── terminal outcome    — accepted words: done / failed; richer set proposed (§4)
```

**Terminology debts (open decisions recommended):**

1. **"typed job manifest" (ADR-0001) vs "Job Envelope" (ADR-0006/0007/0012).** The corpus uses
   both for the dispatch contract. Reading adopted here (proposed clarification): the *manifest*
   is the serialized dispatch document (`rag_job.schema.json`, `jobs/<job>.yaml`); the *envelope*
   is the eight governing fields the manifest must contain. Not ratified — recommend a one-line
   erratum or mini-ADR fixing one term.
2. **"TaskSpec" (course term, TS repo) has no governance counterpart.** The TypeScript course's
   lesson 0007 names the validated work order a *TaskSpec*; this corpus calls the nearest object
   the typed job manifest / envelope. Mapping adopted here (proposed clarification): *TaskSpec ≈
   the validated request that admission turns into an admitted job* — i.e. course-side S1 is this
   plane's Job Admission step. Unresolved; recorded in `docs/open-decisions.md`.

## 3. Control-plane components and ownership

Fourteen functions, whether or not each exists as a distinct component today. "Component" here
means an owned responsibility, not necessarily a process or an agent.

| # | Component | Owns | Must not own | Status | Governed by |
|---|---|---|---|---|---|
| 1 | Operator Interface (`hermes` CLI + Telegram notify/command channel) | receiving requests; notifications; `/clear` `/stop` | admission or completion decisions | scaffolded (`scripts/hermes.py`; Wave-0 Telegram bot) | PDR §6 (D-008/D-020), ADR-0017 |
| 2 | Job Admission (`dispatch_gate.py`) | validity + admissibility: envelope completeness, pack `admitted: true`, memory-canary green — all fail-closed; typed refusal with no ledger row | execution planning; content of the pack | scaffolded (Wave-1 issue 01 done, issue 02 ready-for-human) | ADR-0002 (D-006), D-013, OD-005 wire |
| 3 | Authority Resolution | applying the 11-rank hierarchy; declaring intent↔reality disagreement **Drift** (blocking defect, never auto-resolved by rank) | resolving Drift silently | accepted as policy (no separate component) | PDR §4 (D-005), ADR-0003, ADR-0020 |
| 4 | Context-Pack Assembly | what evidence enters, with provenance labels; admissibility checks 1–9; memory as advisory; CodeGraph as derived section | the dispatch decision | scaffolded (Wave-1 issue 03 ready-for-human) | ADR-0002/0004/0011/0020 |
| 5 | Job Supervisor | state transitions; next permitted action; whole-job completion against the envelope's completion condition | provider-specific mechanics; implementation | accepted as a named Hermes role; **absent as a specified component** — no accepted state machine (§4) | PDR §3, ADR-0001; state model = open decision |
| 6 | Planner | decomposing a job into steps | executing steps | absent as a named component; v1 decomposition is largely static per job type (audit = its flags; `rag new` = the 14-step pipeline) — proposed clarification | ADR-0020 (pipeline); otherwise unowned |
| 7 | Capability Router | choosing the *kind* of executor per step: deterministic script → graph/DB query → retrieval → model reasoning → Claude Code job → human | performing the step; model-route selection (that is model routing) | **proposed clarification as a component**; the ordering rule is accepted: *deterministic scripts run before model calls; a frontier model never inspects work already failing schema/lint/graph checks* (ADR-0007); script-only preferred (ADR-0012) | ADR-0007/0012, ADR-0002 |
| 8 | Policy Services | the eight policy families (§5) as data + checks | executing anything | accepted as rules distributed across ADRs; not a single service | see §5 |
| 9 | Capability Gateways | bounded execution of one authorized step per capability (§6) | job-level decisions | proposed clarification as named components; underlying rules accepted | §6 |
| 10 | Verification / Harness Coordinator | running harnesses A–H per the blocking map; verdicts | fixing what it grades (grader ≠ graded, ADR-0009) | accepted + scaffolded (Wave-1: C/D/H blocking, A/B/E/F advisory; E/F flip at ≥30 golden questions; issue 09) | ADR-0008, `docs/harness-wiring.md` |
| 11 | Approval Coordinator | routing consequential changes to the operator with evidence; recording GO/NO-GO | approving anything itself | accepted (operator + Review-queue page; no automated component) | PDR §3, ADR-0013/0014 |
| 12 | Trace Recorder | recording what happened: run-log Stop hook, ledger rows, Phoenix traces | being consulted as truth about intent | partially scaffolded (hooks + ledger Wave 0; Phoenix Core v1; a queryable *trace graph* is planned/course Phase 4) | ADR-0005/0013; tool matrix |
| 13 | Artifact Publisher | filing every output into the correct `artifacts/` subtree, linked to job + cost | deciding whether the job succeeded | scaffolded (`artifact-publish` skill, PR-gated SkillCandidate; Wave-1 issue 02) | ADR-0013, ADR-0005 |
| 14 | Scheduler / Resume | cron creation (user-approved only, no recursion), fresh isolated sessions, circuit breaker after 2 consecutive failures, catch-up-on-wake once | creating or editing crons autonomously | accepted; Wave-1 candidates built, not scheduled (`docs/cron-candidates.md`) | ADR-0012 (D-008) |

Not all of these are agents. In v1 most are scripts, schemas, checks, or the operator.

## 4. The job lifecycle (proposed clarification)

**What is accepted:** job truth lives in manifests, job state files, and the ledger — never in UI
state (ADR-0018). Accepted transition facts: gate acceptance produces a dispatch record + ledger
row; gate rejection produces a **typed refusal and no ledger row**; kill-at-ceiling keeps the
partial artifact and marks the job **failed** (ADR-0007); unavailable/over-budget model ⇒ **pause
+ notify** (ADR-0007); `/stop` kills background processes (ADR-0012); typed exit codes 0 pass /
1 findings / 2 usage-error (Wave-1 issue 02); terminal words in use: `done`, `failed`.

**What is not accepted:** any enumerated state set. ADR-0018 is titled a task-state policy but
deliberately fixes only *where* state lives. The following model is therefore **proposed**, built
so that every transition is one of the accepted facts above:

```text
requested → validating → grounding → admitted → executing → verifying
        → [awaiting_approval]* → publishing → completed | completed_with_findings

refusals and exits: refused (typed, no ledger row) · blocked (Open Decision / Drift)
· paused (circuit breaker; pause+notify) · cancelled (/stop; cancellation rule)
· failed (killed at ceiling — partial artifact kept · execution error)
· failed_verification (blocking harness red)
*awaiting_approval only on paths that mutate; --no-writeback jobs skip it.
```

Per-state discipline (proposed): each state names its entry condition, allowed next states,
responsible component, evidence produced, and whether model reasoning / tool execution / human
approval is permitted there. The worked table lives in supplement 0006b §6 and should be ratified
or corrected by a future ADR. **Recommended open decision: adopt a canonical job state model**
(see `docs/open-decisions.md`).

## 5. Policy families

"Policy" is not one layer; it is eight decision domains, each with accepted sources:

| Family | Decides | Accepted sources |
|---|---|---|
| Admission | recognized job type? in v1 scope? envelope complete? pack admitted? canary green? Open Decision blocking? | D-002, D-006/D-013, ADR-0002, OD-005 wire |
| Authority | which source wins; what is admissible in the pack; Drift handling | D-005 hierarchy, ADR-0003/0011/0020 (9 checks) |
| Tool & capability | `allowedTools` whitelist (~20 ceiling), per-job-type profiles, MCP admission cards, reach matrix, no write-capable MCPs in unattended crons | ADR-0006, ADR-0017, ADR-0019 |
| Cost & resource | ceilings (spawn $3 · rag new $5 · audit $1 · dream $0.50 · daily $10 · weekly $50 hard stop); alert at 80%; kill at ceiling, partial kept, marked failed; min of persona-default and command ceiling binds; interactive exempt | ADR-0007 (D-019) |
| Routing | deterministic-first ordering; model class per task; personas as routing-table rows; API-only billing; no silent substitution (pause + notify) | ADR-0007, ADR-0015 |
| Approval | operator approves merges, writebacks, memory/skill/cron changes, budgets, promotions; requests arrive with evidence via the Review queue | PDR §3, ADR-0013/0014 |
| Completion | the envelope's completion condition; typed exit codes; harness blocking map defines "passing" per gate; acceptance gates per pillar | D-013, ADR-0008, Wave-1 issue 10 |
| Writeback | mutation ⇒ PR, never direct push; staged proposal artifacts only (Suggestion · Risk · OpenDecision · SkillCandidate · CronCandidate · memory deltas); graph writeback blocked by B/C/D harnesses; Wave 1 does zero writeback | ADR-0001/0003/0008/0012 |

## 6. Capability routing and the gateways

**Capability routing ≠ model routing ≠ Claude Code dispatch.** First decide the *kind* of
executor (capability routing — decision sequence: deterministic? evidence already on file?
retrieval? probabilistic synthesis? repository implementation? human judgement? permitted now?).
Only if the answer is "model reasoning" does *model routing* pick the eligible route (class,
persona row, provider, budget). Only if the answer is "repository implementation" does *Claude
Code dispatch* build an enveloped, context-packed job. Three separate decisions with three
separate owners. (Ordering rule accepted per ADR-0007/0012; the naming is proposed.)

**Gateway map (proposed clarification — named access points for accepted rules):**

| Gateway | Caller | Capability | Enforced before invocation | Returns (result + metadata) |
|---|---|---|---|---|
| Model Gateway | supervisor, per one authorized reasoning step | one bounded model-reasoning request | model policy, route, budget already decided above it | normalized result *or* classified failure; usage/cost; model + provider identity; timing + trace correlation |
| Claude Code Job Gateway | Hermes dispatch, per enveloped repo job | headless Claude Code (`claude -p` report-only; worktree → branch → PR when mutating) | envelope + pack gates; mutation ⇒ PR | implementation evidence: diffs, commands, tests, run-log, costs, limitations, PR status |
| Evidence Gateway | pack assembly, deterministic checks | reads: vault, Smart Connections, Neo4j (read-only, config-soft per ADR-0021 — say "check-verified", not "enforced"), CodeGraph | admissibility + read-only reach | provenance-labeled evidence |
| Tool Execution Gateway | executing steps | admitted MCP tools | `allowedTools`, MCP cards, operation classes | tool results + trace events |
| Artifact Gateway | job completion path | the versioned `artifacts/` tree | vault layout; job + cost linkage | persisted artifact paths |
| Notification Gateway | supervisor, approval coordinator | Telegram (single channel) | reach matrix (ADR-0017) | delivery record |

**Why Claude Code is not a model behind the Model Gateway (accepted boundary, ADR-0001):** a
model call is one stateless, tool-less, bounded request returning text + usage. A Claude Code job
is a governed sub-execution with its own envelope, tool reach, worktree, harness gates, and PR
output — reach and verification the model route must never acquire. Collapsing the two would
erase the tool policy, the PR boundary, and the harness blocking map.

## 7. The Spec-to-Evidence Loop and evidence

> The Spec-to-Evidence Loop is the governed lifecycle through which Hermes transforms an admitted
> job specification into a verified terminal outcome supported by persistent evidence.
> *(proposed clarification — operational expansion of the course mission sentence.)*

Stages: specify → validate → admit → ground → plan → select capability → execute → verify →
decide → record → continue/suspend/terminate. It is a loop because verification or new evidence
can send the job back to grounding, planning, capability selection, execution, or human
clarification — not because model calls repeat.

**Evidence categories** (all are evidence; Graph RAG retrieval is one): governance (PDR/ADRs/
constitutions), semantic (canonical `dev_graph` nodes passing admissibility), project & code
(filesystem/Git truth; CodeGraph derived topology), source & provenance (manifests: stable ID,
checksum, provenance, extraction method, license), retrieval (semantic search — *proposes, never
admits*), execution (run logs, exit codes, artifacts), verification (harness A–H `eval_result`s),
approval (GO records, review-queue decisions, promotion ADRs), operational & cost (ledger, canary
reports), trace (what happened). Note the collision: `dev_graph` frontmatter's `evidence:` enum
(wiki · layer2 · code · benchmark · ADR · external · design) is a narrower, node-level use of the
word. The three graph concepts stay separate: knowledge (what Hermes knows) · workflow (what it
may do) · trace (what it did) — none of the three exists as a merged database, and they never
merge.

## 8. The first vertical slice and the Model Gateway's placement

**Accepted (roadmap Wave 1, grill "Build First"):** the first end-to-end thread is the audit
pillar — `hermes rag audit <project> --graph-health --cost-report --dream-brief --no-writeback` —
report-only, $1 ceiling, zero code edits, zero graph mutation, zero unreviewed memory mutation.
Scaffolded through Wave-1 issues 01–06 (canary wire done; skeleton, pack assembly, graph-health,
read-only proof, cost report ready-for-human); dream pipeline, dashboard cron, harness wiring,
acceptance gate ready-for-agent.

**The load-bearing implementation-order fact:** the walking skeleton reached ready-for-human with
**zero model calls** — envelope, admission, pack, deterministic checks (`graph_health.py`,
`cost_report.py`), vault filing, and the ledger all work without model reasoning. The first steps
that genuinely require a model are synthesis-shaped: prioritizing verified defects, separating
facts from hypotheses, explaining implications, drafting the human-readable report, and the dream
brief (zero-tool, $0.50, Mnemosyne).

> The Model Gateway is introduced when an admitted Hermes job reaches a permitted step that
> requires probabilistic model reasoning and cannot be completed by authoritative retrieval or
> deterministic tools alone.

The TypeScript course introduces the gateway earlier (lesson 0006, before TaskSpec/admission in
0007) for SDK pedagogy — that is a teaching order, not the Hermes OS implementation order.

**The Model Gateway may:** receive an authorized reasoning request; use the already-selected
route; execute the bounded operation; return a normalized result, usage/cost metadata, model +
provider identity, timing + trace correlation, and classified operational failure.
**It must not:** create/admit jobs; assemble packs; rank authorities; decide whether reasoning is
needed; select tools; set budgets; determine whole-job completion; dispatch Claude Code; approve
writeback; merge PRs; persist governance changes; or act as the control loop.

```text
Policy constrains. Router selects. Gateway executes. Supervisor decides.
Harness verifies. Human approves. Trace records.
```

Qualification (accepted): on over-budget or an unavailable route the rule is *pause + notify*
(ADR-0007) — the gateway classifies the condition; the supervisor pauses; nothing substitutes a
model silently.

## 9. Open items exposed by this reference

1. **Canonical job state model** — ADR-0018 fixes where state lives but no ADR enumerates states;
   §4's model needs ratification or correction. (Recommended open decision.)
2. **Manifest vs envelope terminology** — ADR-0001 vs ADR-0006/0007/0012. (Erratum or mini-ADR.)
3. **TaskSpec (course) ↔ manifest/envelope (governance) mapping** — unreconciled naming across
   repos. (Recorded in `docs/open-decisions.md`.)
4. Existing related open items, unchanged by this document: stale-green canary residue; read-only
   proof attribution; OD-005 operator posture history. See `docs/open-decisions.md`.
