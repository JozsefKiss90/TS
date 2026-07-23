# Handoff: Scaffold `hermes-sdk-lab/01-raw-http` (teaching session 2)

## Purpose of the next session

Continue the stateful teaching mission in `C:\Code\TS` (an Obsidian vault + teaching workspace). The next step is **lesson 0002**: scaffold the `hermes-sdk-lab/` progression and build exercise `01-raw-http`, where the user runs a real Messages API request shape against a **local mock server** — no live API calls. This is Phase 0 of the curriculum defined in `C:\Code\TS\handoff-agentic-engineering-typescript-teach.md` (the original mission handoff; still authoritative for phases 0–6 and success criteria).

## Suggested skills

- **`/teach` — invoke first.** Read `C:\Code\TS\.agents\skills\teach\SKILL.md` and its linked format files, then load workspace state (`MISSION.md`, `NOTES.md`, `RESOURCES.md`, `learning-records/`, `wiki/GLOSSARY.md`). The workspace is already bootstrapped — do not re-create it.
- **`claude-api` skill — before writing any Anthropic API/SDK code or fixtures.** In this environment it is the authoritative source for wire shapes (endpoint, headers, Messages request/response fields, current model ids, TS SDK usage). Do not write fixture JSON or example code from memory.
- **Context7 MCP** — per the user's global rule, for pnpm / tsconfig / Node docs when scaffolding.
- **`grilling` — selectively.** Only if the user wants to stress-test the exercise design; do not let it displace hands-on work.
- **`/handoff`** (`.agents/skills/handoff/SKILL.md`) — at the end of the session.

## First order of business: an open recall thread

Lesson 0001's pressure-test left one term unpromoted. The user owes a retry on:

> In your definition, what is the "platform" that `@anthropic-ai/sdk` targets? And name two chores it does so your code doesn't have to.

Collect and pressure-test this **before** the new material. If it passes, flip `wiki/terms/sdk.md` to `status: demonstrated` (add `demonstrated:` date) — the promotion mechanics and the reason it was withheld are in `learning-records/0005-lesson-0001-recall-results.md`. Note the pattern recorded there: the user's mechanism-level recall outruns their definition-level recall — keep testing both.

## State (reference, don't duplicate)

- `MISSION.md` — mission, phase order, guiding principle, settled decisions.
- `NOTES.md` — teaching preferences, **workspace conventions added after session 1** (glossary wiki schema, per-lesson Mermaid requirement, lesson-map notes). Follow these exactly for lesson 0002.
- `learning-records/0001–0005` — prior knowledge + lesson 0001 recall results.
- `lessons/0001-trace-one-request-api-vs-sdk.html` — completed lesson; 0002 continues its thread (its footer promises "you run both of these requests for real and diff the results").
- `wiki/` — glossary wiki (`api`, `type-erasure`, `type-assertion` demonstrated; `sdk` pending; 13 more at `introduced`) and `wiki/lessons/lesson-0001-trace-one-request.md`.
- `assets/` — `course.css`, `quiz.js`, vendored `vendor/mermaid.min.js` + `mermaid-init.js`. Reuse; extend only with reusable components.

## Settled decisions (session 1 — do not re-ask)

- `hermes-sdk-lab/` lives **inside `C:\Code\TS`**, next to `lessons/`.
- **pnpm** is the package manager.
- **Mock-first**: no live API calls yet. Do not assume the user has API credentials; a Claude subscription does not supply them. Confirm auth/billing explicitly before ever proposing a live call.
- Sessions are **~45–60 min**: one lesson can pair concept + hands-on coding.
- Still open: provider neutrality as Phase 1 acceptance criterion (decide before the `ModelGateway` design, not now).

## Design intent for `01-raw-http`

The lab progression (01-raw-http → 08-tested-adapters) is listed in the original mission handoff. For this session build only `01` (and the shared lab root):

- **Lab root:** pnpm workspace or plain folder-per-exercise (agent's call — keep it simple), strict `tsconfig` (`strict`, ESM `"type": "module"`), TypeScript + a no-build runner (e.g. `tsx`). The user runs commands themselves; teach what each config line is for — strict compiler config is itself Phase 0 material.
- **Mock server:** a tiny local HTTP server imitating `POST /v1/messages` — validate the mandatory headers and required body fields, return a canned response fixture with the **real Messages response shape** (verify every field against the claude-api skill), and return realistic errors (400 missing `max_tokens`, 401 missing `x-api-key`, 429 with `retry-after`) so the contract is *experienced*, not read. Note for exercise 02: the official SDK accepts a base-URL override (`ANTHROPIC_BASE_URL` / `baseURL` option), which is how the genuine SDK will hit this same mock later — design the mock with that reuse in mind.
- **Exercise flow (the tangible win):** user writes the raw `fetch` call from lesson 0001 themselves, runs it against the mock, then deliberately breaks it — drop a header, omit `max_tokens`, abort mid-flight with `AbortController` — and observes each failure. Lesson 0001's six circled responsibilities (endpoint, auth, version, contract, error boundary, cancellation) are the checklist.
- **Lesson 0002 HTML** accompanies the lab work and must follow the new conventions in `NOTES.md`: `course.css` + `quiz.js` + vendored Mermaid in the head, ≥1 supplementary Mermaid diagram, equal-length quiz options, retrieval practice with automatic feedback, a lesson-map note in `wiki/lessons/`, and term notes at `status: introduced` (candidates the material will surface: mock/test double, base URL, strict mode, ES modules, lockfile — create only what the lesson actually introduces).
- The user has TypeScript web experience (learning record 0001): don't teach syntax; teach the strictness/config/contract concerns.

## Avoid

- Pre-generating the whole lab or multiple lessons — one exercise, one lesson, feedback-driven.
- Live API calls or assuming credentials exist.
- Writing API shapes, headers, or fixture JSON from memory instead of the claude-api skill.
- Re-asking settled decisions; re-creating workspace state; promoting glossary terms without demonstrated use.
- Filling learning records with coverage — evidence only.

## End of session

Collect recall on lesson 0002's terms, update records/wiki accordingly, and produce a fresh `/handoff` for session 3 (`02-model-client-sdk`: same request through `@anthropic-ai/sdk` pointed at the mock).
