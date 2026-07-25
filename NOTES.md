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

## Update 2026-07-23 — session 2 (lesson 0002 · lab exercise 01-raw-http)
- **`hermes-sdk-lab/` scaffolded** as a pnpm workspace: root `package.json` holds the shared toolchain (typescript ^5.7 → 5.9.3, tsx ^4.19, @types/node ^22); `pnpm-workspace.yaml` globs `"0*"`; every exercise extends `tsconfig.base.json` (TS 5.9 `tsc --init` baseline: `nodenext`, `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `verbatimModuleSyntax`, `noEmit`). Config files carry teaching comments — keep that style in future exercises.
- pnpm 10+ blocks dependency build scripts by default; esbuild is allowed via `allowBuilds` in `pnpm-workspace.yaml`.
- **Mock server conventions** (exercises 02+ reuse it): port 8787 (`PORT` override), `x-mock-scenario: rate-limit` header simulates 429 + `retry-after`, ~400 ms latency creates the abort window, `request-id` header + `request_id` in error bodies. Shapes verified against the claude-api skill; error **wording** is approximated — say so when teaching from it.
- **pnpm is not yet on the user's machine** (Node 22.14 lives in Program Files → `corepack enable` needs an admin terminal once). `01-raw-http/README.md` documents both routes (corepack / `npm i -g pnpm`); the user picks and runs it. I verified the lab once via `npx pnpm` (install + typecheck + endpoint smoke test all pass; lockfile exists).
- `assets/course.css` gained table styles (reusable component).
- **[[sdk]] recall thread resolved:** the term was already promoted by instruction at the end of session 1 (learning-records/0005) — the session-2 handoff's "collect the retry first" was stale. Do not re-ask; lesson 0002's recall Q4 (raw-runtime vs SDK-compile-time contrast) is designed to verify the definitional gap in passing.

## Update 2026-07-24 — session 3 (lesson 0003 · lab exercise 02-model-client-sdk)
- **`02-model-client-sdk` scaffolded**: `@anthropic-ai/sdk` ^0.113.0 as an exercise-level dependency; `pnpm mock` there runs `../01-raw-http/src/mock-server.ts` unchanged (same port 8787, same gates — the base-URL seam demonstrated); `src/client.ts` ships as a TODO scaffold mirroring exercise 01's style; whole workspace typechecks in the shipped state.
- **SDK behavior verified empirically against the mock before teaching** (claude-api skill + installed `.d.ts` + live runs): 429 with default `maxRetries: 2` → 3 requests / 10.1 s honoring `retry-after: 5`, then `RateLimitError` (`.status`/`.type`/`.requestID`/`.headers`); `maxRetries: 0` → fails in ~17 ms; `timeout: 200` (ms!) vs the mock's 400 ms latency → `APIConnectionTimeoutError` after ~2.1 s and 3 attempts (timeouts ARE retried); abort via `{ signal }` → `APIUserAbortError`, 1 attempt (never retried); `apiKey: null, authToken: null` → client-side "Could not resolve authentication method…" before the wire; resolved `Message` carries `_request_id`; `Model` ends in `(string & {})` so model-id typos compile; `mesages` / missing `max_tokens` are TS2769 compile errors with did-you-mean.
- Lesson 0003 (`0003-the-sdk-absorbs-the-six.html`) + lesson-map note + 4 terms at `introduced`: [[api-client]], [[request-options]], [[typed-error]], [[declaration-file]].
- **[[sdk]] definitional gap — verify here:** lesson 0003 recall Q1 asks for a definition of SDK *without the words "tools" or "platform"* (the stock-definition crutch from learning-records/0005). Q4 (SDK mechanics vs gateway policy) feeds directly into Phase 1's `ModelGateway` design — where the still-open provider-neutrality decision must land.

## Update 2026-07-25 — session 4 (lesson 0004 · lab exercise 03-streaming-and-cancellation)
- **Mock server now speaks SSE**: `"stream": true` in the body → `200 text/event-stream` with the real event grammar (`message_start` skeleton → `ping` → `content_block_start` → 8× `content_block_delta` ~120 ms apart → `content_block_stop` → `message_delta` → `message_stop`; shapes verified against the claude-api skill). Same gates, same fixture — the assembled message is byte-for-byte the JSON path's. Non-streaming paths unchanged (exercise 01 client re-run as regression check).
- **`03-streaming-and-cancellation` scaffolded** (package.json mirrors exercise 02; TODO scaffold in three parts A/B/C; whole workspace typechecks shipped).
- **SDK streaming behavior verified empirically** (SDK 0.113.0 `.d.ts` + live runs): raw `create({stream:true})` → 13 events / ~1.4 s, ping filtered out by `core/streaming.js`; `stop_reason` + real `output_tokens` only in `message_delta` at the end; helper `messages.stream()` → 8 `on("text")` chunks from ~540 ms, `finalMessage()` matches the non-streaming Message **except `_request_id: undefined`** (assembled client-side; id lives on `stream.request_id`); abort at 700 ms → `APIUserAbortError` ~30 ms later, 41/164 chars kept, 2/8 deltas sent, remainder never generated, never retried; `stream.currentMessage` shows the partial with `stop_reason: null`.
- **pnpm 11.17.0 is now installed globally** on the user's machine — the session-2 corepack/npx workaround is obsolete.
- **Ops caveat:** a `pnpm mock` left running from a previous session serves *old* code (tsx doesn't hot-reload) and holds port 8787 — found and killed one from 2026-07-24 during verification. If streaming misbehaves, check for a stale mock first.
- Lesson 0004 (`0004-the-response-becomes-a-process.html`) + lesson-map note + 4 terms at `introduced`: [[server-sent-events]], [[delta]], [[async-iterator]], [[message-stream]].
- **Recall debt:** the user reports completing lesson 0003 + exercises, but no learning record exists for lesson 0003's §7 say-it-in-your-own-words (incl. the [[sdk]] definitional check from learning-records/0005). Collect it in chat before or alongside lesson 0004's lab; record evidence, promote on demonstration only.
- Removed an accidental paste from the lesson-0003 map note (a terminal remark: user has **no API key, subscription only**) — consistent with the settled mock-first cost route; reconfirm the auth/billing route before any live-call exercise.
- Next lesson promised in 0004's footer: `04-validate-the-boundary` — Zod at the JSON boundary (the assertion→parse payoff set up since lesson 0001 §3), closing Phase 0.
- **`ROADMAP.md` created (user request):** all phases 0–6 with per-phase goals, exit criteria, and lesson tables. Firmness gradient by design — shipped = history, next lesson (0005) = firm, everything further = provisional/gated — so it does not violate the never-generate-a-course-in-advance rule. **Maintenance duty:** when a lesson ships, flip its status there (and resequence freely for unshipped rows); phase 2+ ids are assigned only when a phase opens.

## Workspace conventions
- Lessons: `lessons/NNNN-name.html`, linked to `../assets/course.css` + `../assets/quiz.js`.
- Glossary wiki: one note per term in `wiki/terms/<slug>.md`. Frontmatter: `term`, `aliases`, `type: glossary-term`, `lesson` (zero-padded string), `phase`, `category` (`protocol` / `sdk-layer` / `type-system` / `validation` / `hermes`), `status` (`introduced` → `demonstrated`), `introduced` / `demonstrated` dates, `tags` (= `glossary` + category; drives graph color groups in `.obsidian/graph.json`). Body: definition, lesson context, Hermes relevance, `[[related]]` links. Full schema and DataView indexes: `wiki/GLOSSARY.md`.
- Per-lesson wiki map: `wiki/lessons/lesson-NNNN-<short-name>.md` (`type: lesson-map`) — links the lesson's term cluster, holds its Mermaid diagrams in markdown form, DataView table of the lesson's terms. **Authoring a new lesson now includes:** its lesson-map note + term notes at `status: introduced` + at least one supplementary Mermaid diagram in the HTML.
- Mermaid in HTML lessons: add `<script src="../assets/vendor/mermaid.min.js" defer></script>` and `<script src="../assets/mermaid-init.js" defer></script>` to the head; mark diagrams up as `<figure class="diagram"><pre class="mermaid">…</pre><figcaption>…</figcaption></figure>`. Wiki notes use plain ```mermaid fences — Obsidian renders them natively.
- Assets are reusable components — check `assets/` before authoring anything new.
- Hermes OS background lives at `C:\Code\Hermes OS\.scratch` (PRDs, grill decisions, wave issues).
