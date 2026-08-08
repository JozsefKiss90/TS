# CLAUDE.md — Constitution of the Teaching Workspace

Guidance for Claude Code and other agents working in this repository. **This file is constitutional:** it defines exactly what a lesson is and how course material is authored here. Where any other document, convention, or session handoff conflicts with it, this file wins. It is amended by editing this file and recording the why as a dated update in `NOTES.md` (see Article VII).

## What this repo is

A `teach`-skill teaching workspace (`.agents/skills/teach/SKILL.md`): `MISSION.md`, `ROADMAP.md`, `RESOURCES.md`, `learning-records/`, `lessons/*.html`, `hermes-sdk-lab/`, `wiki/`, `assets/`, `NOTES.md`. The repo root is also an Obsidian vault (DataView enabled): the glossary is a wiki, and course governance lives at `wiki/course/`.

The course builds the **Hermes Spec-to-Evidence Loop** — the control plane of Hermes OS. The thematic spine (terminal skills and where they are used) is `wiki/course/course-spine.md`; the Hermes OS integration scenario every lesson anchors to is `wiki/course/hermes-integration.md`; Hermes OS reference docs are at `docs/hermes_os/`.

## Governing documents

| Document | Role | Binding? |
|---|---|---|
| `CLAUDE.md` (this file) | Constitution: what a lesson must be | Yes — wins all conflicts |
| `MISSION.md` | Why, success criteria, constraints, out-of-scope | Yes |
| `wiki/course/` | Course semantics: spine, Hermes integration, module graphs, pedagogy record | Notes marked `normative: true` bind lessons |
| `ROADMAP.md` | The plan: phases, gates, statuses | Gates bind; unshipped lesson rows are provisional |
| `NOTES.md` | User teaching preferences + dated history of every decision | Preferences bind; updates are the record |
| `wiki/GLOSSARY.md` | Glossary frontmatter schema and indexes | Yes |

**Before authoring a lesson, read:** the latest `NOTES.md` updates, `wiki/course/course-spine.md`, `wiki/course/hermes-integration.md`, and the lesson's `ROADMAP.md` row.

## Article I — What every lesson ships

1. **HTML lesson** at `lessons/NNNN-name.html`, linking the shared components in `assets/` (`course.css`, `quiz.js`). Reuse components; never inline what a future lesson would duplicate.
2. **Glossary-wiki cluster** — one note per introduced term at `wiki/terms/<slug>.md`, created at `status: introduced` (promoted to `demonstrated` only on demonstrated correct use), plus a lesson-map note at `wiki/lessons/lesson-NNNN-<short-name>.md` (`type: lesson-map`) linking the term cluster and mirroring the diagrams. Schema: `wiki/GLOSSARY.md`.
3. **At least one Mermaid diagram.** HTML: `assets/vendor/mermaid.min.js` + `assets/mermaid-init.js` (both `defer` in `<head>`), marked up as `<figure class="diagram"><pre class="mermaid">…</pre><figcaption>…</figcaption></figure>`. Wiki notes use plain ```` ```mermaid ```` fences.
4. **A lab exercise** in `hermes-sdk-lab/` whenever the lesson is hands-on (most are): pnpm workspace conventions, config files carry teaching comments, **mock-first** — no live API calls until the cost/auth route is confirmed.
5. **Bookkeeping in the same session:** flip the lesson's status in `ROADMAP.md` and in `wiki/course/course-module-graph.md`; add a dated update to `NOTES.md`.

## Article II — Lesson anatomy

The shipped skeleton of lessons 0001–0004 is the standard:

1. **Header:** kicker (`Hermes · Phase N · Lesson NNNN · ~45–60 min`), title, and a lede that states the lesson's **main question** in one sentence.
2. **Mission callout** immediately after the header: the win in one sentence, the spine thread(s) it advances (`wiki/course/course-spine.md` § *The recurring threads*), and the integration-scenario step(s) **S1–S9** it builds toward (`wiki/course/hermes-integration.md`). A lesson that cannot name its scenario step is off-spine — do not author it.
3. **Numbered `h2` sections:** 2–4 concept sections → the lab exercise → a classification exercise → Quiz → *Say it in your own words* → *Primary source* footer with the next-lesson pointer.
4. **One tangible win, ~45–60 minutes.** If the material wants more, split the lesson.

## Article III — Explanation standards

Earned from the lessons 0001–0004 review and supplement; the full defect record is `wiki/course/course-pedagogy.md`. Every lesson must satisfy all nine:

1. **Wire truth.** When behavior crosses the network, show the actual exchange — method, headers, body, or SSE frames — not only the SDK code above it. SDK-level explanation without the wire underneath is the gap that forced the lesson-0004 review.
2. **Layer accounting.** Any claim that "X changes Y" is decomposed into a which-layer-changes table (endpoint / auth / media type / body / lifecycle / …). "Streaming changes the contract" is true at three layers and false at six — say which.
3. **Signature discipline.** A new API surface is introduced by reading its declaration: decompose the call as an object path (import → construct → property → method → invoke), give a syntax / meaning / what-exists-at-runtime table for the entry point, explain overloads whenever the return type depends on the arguments, and state the distinction every time: *a signature tells TypeScript what may be called; the implementation does the runtime work. The SDK abstracts chores away from your application code, not away from TypeScript.*
4. **Type + value pairing.** Every new type appears twice: as an (abridged) declaration and as a typical runtime value beside it.
5. **Collision table.** The first time a word is overloaded across levels (e.g. "message": request property / response object / stream event / `MessageStream`), disambiguate with a term-vs-meaning table before proceeding.
6. **Seen-instance rule.** A new abstraction (e.g. discriminated union) is taught from an instance the learner has already met in an earlier lesson, explicitly cross-referenced, before it is applied to the new material.
7. **Deconfuse coinages.** Any coined phrase ("two SDK surfaces", "the six") is immediately followed by what it does *not* mean.
8. **New-vs-reprise + compression.** Each lesson enumerates its genuinely new ideas (at most five) as distinct from reprise, and closes with an N-statement compression ("if you keep only five sentences…").
9. **Present-vs-planned labeling.** Any capability of the wider system a lesson references (a policy, subsystem, or loop stage) is labeled **implemented** (runs in this lesson's lab), **seeded** (a field or seam exists for it), or **planned** (cited to `ROADMAP.md`/`MISSION.md`, never written in the present tense as if shipped). That scale grades **lab code only**: when the referenced system has its own governance record (PDR/ADRs — for Hermes OS, the `hermes-os` repo), claims about *it* are graded against that record as **accepted · scaffolded · planned · proposed clarification · open decision · illustrative only**, citing the governing document — a document merely mentioning a concept never earns "implemented". Architecture context beyond the lesson's slice links to `wiki/course/course-architecture.md` (course-side) or `docs/hermes_os/architecture/hermes-job-control-plane.md` (system-of-record) instead of being re-explained or, worse, implied. (Earned from the lesson-0006 primer, `course-pedagogy` row 12; extended by supplement 0006b, row 13.)

## Article IV — Evidence and verification

1. **Version pin.** Every SDK/library excerpt states the exact version it was verified against (no `^`/`~` in the reproduction instructions). Generated surfaces drift; unpinned excerpts rot silently.
2. **Verify before teaching.** SDK/API behavior is confirmed against current primary sources (in-session, the `claude-api` skill is authoritative for Anthropic shapes), the installed `.d.ts`, and — where a mock exists — live runs against it. Empirical numbers in lessons come from actual measurements.
3. **Disclose approximations.** Where the mock approximates the real service (e.g. error wording), the lesson says so.

## Article V — Recall, quizzes, glossary

1. **The shipped calibration is the standard** (user-confirmed 2026-07-25, right level — do not redesign): four quiz questions, equal-length options, immediate automatic feedback, no format clues; plus one classification exercise and a *Say it in your own words* section.
2. **Retrieval practice** every session: the glossary's *Awaiting promotion* DataView is the queue. Terms promote to `demonstrated` only on demonstrated correct use; learning records only on evidence or explicit disclosure — coverage is not learning.
3. Collect outstanding say-it-in-your-own-words responses in chat before or alongside the next lesson's lab.

## Article VI — Sequence and scope

1. **Feedback-first:** author one lesson at a time; never generate a large course in advance. `ROADMAP.md` is a plan with a firmness gradient, not a syllabus.
2. **Every lesson ties to Hermes** (Article II.2). No generic TypeScript syntax teaching.
3. **Sequence discipline:** raw HTTP before SDK; model-client SDK before Agent SDK; single-agent before multi-agent; Phase 6 opens only on benchmark evidence.
4. **The three graphs never merge:** knowledge (what Hermes knows), workflow (what it may do), trace (what it did). Rationale: `wiki/course/hermes-integration.md`.
5. **Python's territory is respected:** embeddings, data science, Graph RAG internals stay behind typed ports.

## Article VII — Supplements are defect signals

If a shipped lesson needs a post-hoc review or supplement to be understood, the constitution failed. The response is: add the gap to `wiki/course/course-pedagogy.md`, amend the Article that should have prevented it, record the why as a dated `NOTES.md` update, and apply the fix from the next lesson forward. Shipped lessons are history — retro-edit only on explicit user request. (`lessons_review.md` and the signature-trace supplement are the founding instances of this procedure.)

## Agent skills

### Issue tracker

Issues and specs live as local markdown files under `.scratch/<feature>/` in this repo. See `docs/agents/issue-tracker.md`.

### Triage labels

The five canonical triage roles, with label strings equal to their names (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `CONTEXT.md` plus `docs/adr/` at the repo root, created lazily by the domain-modeling skill. See `docs/agents/domain.md`.
