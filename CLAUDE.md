# CLAUDE.md

Guidance for Claude Code and other agents working in this repository.

## Teaching workspace

This repo is a `teach`-skill teaching workspace (`.agents/skills/teach/SKILL.md`): `MISSION.md`, `RESOURCES.md`, `learning-records/`, `lessons/*.html`, `wiki/`, `assets/`, `NOTES.md`. The repo root is also an Obsidian vault (DataView enabled), so the glossary is a wiki.

**Authoring a new lesson means shipping all three of the following, not just the HTML:**

1. **HTML lesson** at `lessons/NNNN-name.html`, linking the shared components in `assets/` (`course.css`, `quiz.js`). Reuse components; never inline what a future lesson would duplicate.
2. **Glossary-wiki notes** — one note per term introduced, at `wiki/terms/<slug>.md`, created at `status: introduced` (promoted to `demonstrated` only after the user demonstrates correct use). Plus a per-lesson map note at `wiki/lessons/lesson-NNNN-<short-name>.md` (`type: lesson-map`) that links the term cluster and holds the lesson's diagrams. Frontmatter schema and DataView indexes: `wiki/GLOSSARY.md`.
3. **At least one Mermaid diagram.** In the HTML, load `assets/vendor/mermaid.min.js` + `assets/mermaid-init.js` (both `defer` in `<head>`) and mark diagrams up as `<figure class="diagram"><pre class="mermaid">…</pre><figcaption>…</figcaption></figure>`. Mirror the diagram(s) in the lesson-map note using plain ` ```mermaid ` fences — Obsidian renders them natively.

Full conventions, settled decisions, and rationale live in `NOTES.md` (**Workspace conventions** + dated updates) and `wiki/GLOSSARY.md`. Read `NOTES.md` before authoring a lesson.

## Agent skills

### Issue tracker

Issues and specs live as local markdown files under `.scratch/<feature>/` in this repo. See `docs/agents/issue-tracker.md`.

### Triage labels

The five canonical triage roles, with label strings equal to their names (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `CONTEXT.md` plus `docs/adr/` at the repo root, created lazily by the domain-modeling skill. See `docs/agents/domain.md`.
