# Teaching notes

## How this user wants to be taught (from handoff, 2026-07-23)
- Short, tightly scoped lessons with one tangible win each; feedback-driven cadence — never generate a large course in advance.
- Every lesson tied to Hermes; no generic TypeScript syntax teaching.
- Retrieval practice with immediate, automatic feedback; quiz options equal length.
- Verify SDK/API behavior against current primary docs before teaching it — SDK examples drift. (In-session: the `claude-api` skill is the authoritative source for Anthropic API/SDK shapes.)
- Use the grilling skill selectively to interrogate specs before implementation exercises — not as a replacement for hands-on teaching.
- Produce a `/handoff` at meaningful session boundaries.
- Glossary: promote terms only after the user demonstrates correct use. Learning records only on evidence or explicit disclosure — coverage is not learning. *(Since 2026-07-23 the glossary is a wiki — capture at `status: introduced`, promote by flipping to `demonstrated`; see Workspace conventions.)*
- Sequence discipline: model client SDK before Agent SDK; single-agent before multi-agent; raw HTTP before SDK (see what's abstracted).

## Decisions (settled in session 1, 2026-07-23)
- `hermes-sdk-lab/` lives **inside this repo** (C:\Code\TS), next to `lessons/`.
- Package manager: **pnpm**.
- Cost route: **mock first, live later** — recorded fixtures and a FakeModelGateway from the start; add live calls once the loop shape is understood. When live calls begin, confirm the auth/billing route first (a Claude subscription does NOT supply API credentials).
- Session sizing: **~45–60 minutes** — each lesson can pair a concept with hands-on coding.

## Still open
- Provider neutrality as a Phase 1 acceptance criterion vs Claude-only initially — decide before Phase 1's ModelGateway design.

## Update 2026-07-23 — glossary wiki + Mermaid diagrams (user request after lesson 0001)
The user asked for two structural additions to the course:
1. **Per-lesson glossary as an Obsidian wiki.** The repo root is an Obsidian vault (`.obsidian/`, DataView enabled). Every lesson's terminology gets one note per term under `wiki/terms/`, wikilinked so the graph view clusters by lesson. Implemented for lesson 0001 (17 terms). The old promotion rule is preserved as metadata, not abandoned: notes are *created* at `status: introduced` when a lesson introduces them, and *promoted* to `status: demonstrated` only on demonstrated correct use.
2. **Supplementary Mermaid diagrams in course material.** Every lesson ships at least one diagram. Mermaid v11 is vendored at `assets/vendor/mermaid.min.js` (offline-capable, pinned). Lesson 0001 now has a sequence diagram of the six responsibilities; its wiki lesson-map has two more.
3. **Lesson 0001 deepened (same day, user request):** new §3 "The response types, up close" — the abridged `Message` interface (`content` block union, `stop_reason`, `usage`), the parse→assert pipeline, and why response types are *compile-time claims about runtime bytes* (SDK shape verified against the claude-api skill). Added a second Mermaid diagram, two classification items, a fourth recall question, and the [[type-assertion]] wiki term.

## Workspace conventions
- Lessons: `lessons/NNNN-name.html`, linked to `../assets/course.css` + `../assets/quiz.js`.
- Glossary wiki: one note per term in `wiki/terms/<slug>.md`. Frontmatter: `term`, `aliases`, `type: glossary-term`, `lesson` (zero-padded string), `phase`, `category` (`protocol` / `sdk-layer` / `type-system` / `validation` / `hermes`), `status` (`introduced` → `demonstrated`), `introduced` / `demonstrated` dates, `tags` (= `glossary` + category; drives graph color groups in `.obsidian/graph.json`). Body: definition, lesson context, Hermes relevance, `[[related]]` links. Full schema and DataView indexes: `wiki/GLOSSARY.md`.
- Per-lesson wiki map: `wiki/lessons/lesson-NNNN-<short-name>.md` (`type: lesson-map`) — links the lesson's term cluster, holds its Mermaid diagrams in markdown form, DataView table of the lesson's terms. **Authoring a new lesson now includes:** its lesson-map note + term notes at `status: introduced` + at least one supplementary Mermaid diagram in the HTML.
- Mermaid in HTML lessons: add `<script src="../assets/vendor/mermaid.min.js" defer></script>` and `<script src="../assets/mermaid-init.js" defer></script>` to the head; mark diagrams up as `<figure class="diagram"><pre class="mermaid">…</pre><figcaption>…</figcaption></figure>`. Wiki notes use plain ```mermaid fences — Obsidian renders them natively.
- Assets are reusable components — check `assets/` before authoring anything new.
- Hermes OS background lives at `C:\Code\Hermes OS\.scratch` (PRDs, grill decisions, wave issues).
