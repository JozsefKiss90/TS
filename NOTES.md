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
- *(nothing — the provider-neutrality question, open since session 1, was decided in lesson 0006; see Update 2026-07-29.)*

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

## Update 2026-07-25 — governance: CLAUDE.md promoted to constitution; `wiki/course/` created (user request)
- **Trigger:** the user's course review found the material coherent and correctly scoped but missing its thematic spine and overall context — unclear what skills the course ends with and how they are used in Hermes OS; and lessons 0001–0004 needed post-hoc materials to be fully understood (`lessons_review.md` + `learning-records/supplement-signature-trace-from-new-anthropic-to-message.html`). Goal: make such supplements the rare exception by moving what they added into standing law.
- **CLAUDE.md is now the course constitution** (wins all conflicts, including with this file's Workspace conventions). Articles I–VII: I ships (the triple + lab + bookkeeping), II anatomy (mission callout must name the spine thread and integration-scenario step S1–S9), III explanation standards (wire truth, layer accounting, signature discipline, type+value pairing, collision tables, seen-instance rule, coinage deconfusion, new-vs-reprise + compression), IV evidence (version pinning elevated to law), V recall (the shipped quiz calibration pinned — user confirmed the level is right), VI sequence/scope, VII supplements-are-defect-signals (amendment procedure).
- **`wiki/course/` created** (index `COURSE.md`, frontmatter `type: course-doc`): [[course-spine]] (terminal skills table + the arc; normative), [[hermes-integration]] (why TypeScript/the SDKs are integral to Hermes OS; course-artifact ↔ OS-component map; the one-audit-job scenario S1–S9; normative), [[course-pedagogy]] (gap → Article defect record from the review/supplement), [[course-module-graph]] (ROADMAP as Mermaid graphs; sync duty on status flips). ROADMAP.md links across.
- Existing lessons deliberately **not** modified (user instruction) — Article VII makes that the standing rule: fix forward, retro-edit only on explicit request.

## Update 2026-07-27 — session 5 (lesson 0005 · lab exercise 04-validate-the-boundary · Phase 0 closes)
- **Mock server can now let its contract drift** (JSON path only; exercises 01–03 re-run as regression, unchanged): `x-mock-scenario: drift` header → 200 whose body has `usage.output_tokens` as the **string** `"42"` and `stop_reason: "end-turn"` (hyphen). Two drifts on purpose: a type-level lie (caught by `z.number()`) and a value-level lie (`"end-turn"` *is* a string — only `z.enum` catches it; the schema carries more contract than exercise 01's `stop_reason: string` interface ever did).
- **`04-validate-the-boundary` scaffolded**: `zod` pinned **exact 4.4.3** (no `^` — issue codes and `prettifyError` formatting are version-specific; Article IV). Part A ships complete (the motivating demo), Parts B/C are TODO; whole exercise typechecks shipped.
- **Zod behavior verified empirically** (installed `.d.ts` at `zod/v4/classic/` + live runs): drifted body through exercise 01's `as` pipeline → no error anywhere, ledger `11 + "42"` = `"1142"` (string concat), `> 1000` ceiling check fires a **phantom breach** (actual spend 53); same bytes through `safeParse` → `success: false` with **2 issues from one parse** (`invalid_value` at `stop_reason` with `values` list; `invalid_type` at `usage.output_tokens` with `expected: "number"` — v4 issue fields); `z.prettifyError` renders `✖ … → at path` lines; clean path → ledger 53, `typeof number`, and **unknown keys stripped** (wire 9 keys → 7; `usage` 4 → 2; default `z.object` policy, `strictObject` would reject — disclosed in the lesson).
- Lesson 0005 (`0005-validate-the-boundary.html`) + lesson-map note + 4 terms at `introduced`: [[json-boundary]], [[zod-schema]], [[safe-parse]], [[schema-inference]]. First lesson authored fully under the constitution: new-vs-reprise callout, five-sentence compression, "parse" collision table, syntax/meaning/runtime table for `z`, seen-instance (safeParse's union ← `block.type`/`event.type`).
- **Phase 0 complete** — ROADMAP and module graph flipped; Phase 1 open, 0006 The Model Gateway is ▶ (its entry decision — provider neutrality — still open, must land there).
- **Ops caveats hit again:** (1) a stale `pnpm mock` from earlier today held port 8787 serving pre-drift code — killed it (same trap as 2026-07-25; check first whenever the mock misbehaves). Background mock stopped after verification — no stale server left. (2) `pnpm -r typecheck` at the lab root currently **fails** on the user's own `02-model-client-sdk/src/cilent2.ts` (committed experiment file, syntax error at line 43) — deliberately not touched; per-exercise typechecks all pass. Flag to the user.
- **Recall debt outstanding (Article V.3):** say-it-in-your-own-words responses for **lesson 0003 §7** (incl. the [[sdk]] definitional check) *and* **lesson 0004 §8** are still uncollected — the user reports both lessons complete, but no learning records exist. Collect in chat before or alongside the 0005 lab. [[runtime-validation]] (introduced 0001) is the prime promotion candidate once used correctly in the 0005 work.

## Update 2026-07-27 — recall debt cleared (lessons 0003 §7 + 0004 §8, same day as session 5)
- The user delivered all eight say-it-in-your-own-words answers in chat; **all correct, mechanism-level** — full evidence in learning-records/0006 (lesson 0003) and 0007 (lesson 0004). The session-5 "recall debt outstanding" bullet above is resolved.
- **The [[sdk]] definitional gap (learning-records/0005) is closed with evidence**: under recall pressure the user produced the relational definition (library that does an API's chores; the wire protocol unchanged), not the stock one. The watch-pattern (dictionary definitions under pressure) did not reoccur — stop tracking it.
- **Promoted to `demonstrated` (10):** [[server-sent-events]], [[delta]], [[async-iterator]], [[message-stream]], [[request-options]], [[api-client]], [[retry-with-backoff]], [[cancellation]], [[stop-reason]], [[model-gateway]].
- **Held at `introduced`, with a promotion path:** [[runtime-validation]], [[discriminated-union]], [[narrowing]] → promote on the 0005 lab's Parts B/C (safeParse union narrowing = their cleanest workout); [[typed-error]], [[declaration-file]] → not exercised by these answers; pressure-test alongside the 0005 say-it or the 0006 gateway work.
- **Carry-forward for lesson 0009 (bounds):** the user derived unprompted that in-stream budget aborts must act on a *conservative estimate* because true `output_tokens` arrive only in `message_delta` — quote this back when designing S6 enforcement.
- Two sharpenings given in chat, worth not repeating as errors: the SDK performs **no** runtime shape validation of success bodies (not "not generally"); and timeouts are among the retried failures (measured session 3).

## Update 2026-07-29 — session 6 (lesson 0006 · lab exercise 05-model-gateway · Phase 1 opens)
- **`05-model-gateway` scaffolded** (five files, and the file boundaries are the lesson): `gateway.ts` — the port, Hermes-owned, given; `supervisor.ts` — policy, given, imports only the port; `anthropic-gateway.ts` — the adapter, happy path + boundary parse given, **error classification is TODO Part B**; `fake-gateway.ts` — **TODO Part C**; `main.ts` — wiring + parts driver (`pnpm job a|b|c`). Deps: `@anthropic-ai/sdk` ^0.113.0 (verified against 0.113.0), `zod` 4.4.3 exact. Whole exercise typechecks in the shipped state; parts B/C crash with instructive messages until implemented.
- **Gateway behavior verified empirically against the mock** (all numbers in the lesson are these runs): clean call → `{ outcome: 'landed', tokensSpent: 53, notes: ['stop: completed', 'request: req_mock_0001'] }` (wire `end_turn` → Hermes `completed`); 429 with `maxRetries: 0` → `{ kind: 'throttled', retryAfterMs: 5000 }` (wire `retry-after: 5` s → port ms); abort at 100 ms → `{ kind: 'aborted' }`; exercise 04's drift scenario through the adapter → `malformed_reply` with the same 2 issues, supervisor books **0** tokens (vs. exercise 04 Part A's `"1142"`); with the mock **stopped**, `FakeModelGateway` ran the same supervisor (incl. the retry-later policy branch) in **0.6 ms**.
- **Provider-neutrality decision LANDED (was open since session 1): provider-neutral port, exactly one live adapter.** Why: the port's vocabulary (`ModelCall`/`ModelReply`/`StopCause`/`GatewayFailure`) is derived from the loop's needs (S4–S6) and names nothing provider-shaped, so neutrality costs nothing; a second live adapter serves no requirement and no benchmark (MISSION's no-speculative-work rule); the fake is the second implementation that keeps the port honest; provider choice, when it comes, is routing policy above the port. Recorded in ROADMAP (Phase 1 entry decision), [[model-gateway]], and lesson 0006 §4.
- Lesson 0006 (`0006-the-model-gateway.html`) + lesson-map note + 4 terms at `introduced`: [[port]], [[adapter]], [[fake]], [[dependency-inversion]]. Second lesson authored fully under the constitution (layer-accounting table, port collision table, syntax/meaning/runtime table for the interface, fake-vs-mock table, new-vs-reprise, five-sentence compression). The learner's own 0008-record argument ("a plausible silent error is more dangerous than a conspicuous false alarm") is quoted in §3 as the rationale for validating `usage` at the boundary.
- **Promotion paths:** [[typed-error]] and [[declaration-file]] (held since 0003) are pressure-tested by lesson 0006 §8 Q2/Q3 — collect the say-it answers in chat before or alongside the 0007 lab, promote on evidence. The four new terms promote on demonstrated use in the Part B/C implementations or the say-it.
- **Ops caveat, third occurrence:** a stale `pnpm mock` from 2026-07-28 holds port 8787 (PID 96372, left over from the user's 0005 session; permission to kill it was declined this session, so it is **still running**). It happens to serve current code (mock-server.ts unchanged since 07-27), but the user should Ctrl+C/kill it before running the 0006 lab, or the lab's `pnpm mock` will die with EADDRINUSE. Lesson verification ran on a private instance (`PORT=8899` + `ANTHROPIC_BASE_URL`) that was stopped afterwards.
- Not touched, still flagged from session 5: `02-model-client-sdk/src/cilent2.ts` (user's experiment file) still breaks `pnpm -r typecheck` at the lab root; per-exercise typechecks pass.

## Update 2026-07-29 — supplement 0006a (Hermes Architecture Primer) + Article III.9 (user request, same day as session 6)

- **Why a supplement was needed:** lesson 0006 quotes S4's "above it: Hermes policy — routing, provider, model choice" and says "routing is policy" without first teaching the system those words live in — the Spec-to-Evidence Loop, the supervisor's future role, what operationally counts as Hermes policy, and which capabilities exist in exercise 05 versus which are only planned. A careful reader could mistake the one-call policy seed (`superviseOneCall`) for a routing engine, complete supervisor, budget/permission system, or durable trace. Per Article VII this is a defect signal — recorded as [[course-pedagogy]] row 12.
- **What ships:** `lessons/0006a-hermes-architecture-primer.html` (~20–30 min; one end-to-end Hermes run with every step labeled implemented/seeded/planned; the operational definition of policy vs its four neighbours — port contract, wiring, adaptation, SDK mechanics — plus the wire; `superviseOneCall` traced as a **policy seed**; wiring-vs-routing with the load-bearing sentence *"lesson 0006 reserves model selection for policy; it does not yet implement model-selection policy"*; three Mermaid diagrams — intended loop with the three graphs separate, layer/ownership stack, present-vs-future; who-decides matrix with the two-retries ambiguity resolved; two classification exercises, 4-question quiz, 4 say-it prompts, five-sentence compression). Durable compact form: `wiki/course/course-architecture.md` (`doc: architecture`, `normative: false` — a mirror; MISSION/ROADMAP/[[hermes-integration]] win conflicts). Three terms at `introduced`, lesson `"0006a"`: [[hermes-policy]], [[composition-root]] (alias *wiring*), [[routing-policy]].
- **Why a supplement, not lesson 0007:** it adds no capability, no lab, no new spine thread — it is context for material already shipped. Numbering it would displace the firm 0007 (TaskSpec) and violate feedback-first sequencing; `0006a` keeps 0007's number and status untouched.
- **Claims in lesson 0006 narrowed (retro-edit authorized by the user's request):** §4's "The fake is the second provider, for free" → "the second *implementation* … a test double, not a second provider, and not proof of interoperability with any real one." Also added: a callout after the mission callout linking the primer and stating when to read it (end of §1, or right after the lesson, before 0007). Exercise 05 README gained the same pointer plus an honest-scope paragraph; runtime behavior of the exercise is untouched.
- **Defect found while validating:** the shipped `supervisor.ts` header comment contained the literal string `"@anthropic-ai/sdk"` ("grep it and find nothing"), which made the README's own dependency-direction grep hit three files instead of the documented two. Reworded the comment (no code change, runtime untouched); `grep -rl "@anthropic-ai/sdk" src/` now hits exactly `anthropic-gateway.ts` and `main.ts` as documented.
- **Constitution amended (Article VII procedure):** new Article III.9 *Present-vs-planned labeling* — wider-system capabilities a lesson references must be labeled implemented/seeded/planned, planned ones cited to ROADMAP/MISSION and never written in present tense; architecture context links to [[course-architecture]] instead of being re-implied. ROADMAP Phase 1 gained one supplement line; no status or sequence changed — 0007 remains ▶.

## Update 2026-07-30 — supplement 0006b (The Hermes Control Plane: From Job to Evidence) + Article III.9 extended (user request, prompt.md)

- **Why a second supplement was needed:** 0006a closed row 12's *code-seam* gap but still assumed the surrounding Hermes OS was defined somewhere — the course said "job", "supervisor", "routing", "Spec-to-Evidence Loop" while the governance record that defines them (PDR-001 accepted 2026-07-05, ADR-0001..0021, roadmap, open decisions in the `hermes-os` repo, mirrored under `docs/hermes_os/`) was never surfaced. A learner could not answer *what is a Hermes job, what lifecycle does it follow, when does the Model Gateway become necessary* — nor see the decisive fact that the real Wave-1 audit skeleton reached human review with **zero model calls**. Per Article VII: defect signal, recorded as [[course-pedagogy]] row 13.
- **What ships:** `lessons/0006b-the-hermes-control-plane.html` (~35–50 min, deliberately zero TypeScript; begins with the actual v1 job `hermes rag audit atlas --graph-health --cost-report --no-writeback` and walks it in twelve moments; defines the OS and its v1 boundary, the Hermes job — eight-field Job Envelope, Context Pack, composed job structure — the fourteen control-plane components with an ownership table, eight policy families, a **proposed** job state machine grounded only in accepted transition facts, the Spec-to-Evidence Loop with ten evidence categories, capability routing before model routing, the six-gateway map, the Model Gateway placement rule and its twelve must-nots; five Mermaid diagrams incl. a stateDiagram; four classification exercises, six-question quiz per the user's spec — a deliberate, prompt-directed extension of Article V's four-question calibration, format otherwise unchanged — five say-it prompts, seven-sentence compression). Nine terms at `introduced`, lesson `"0006b"`: [[hermes-job]], [[job-envelope]], [[context-pack]], [[job-supervisor]], [[capability-routing]], [[capability-gateway]], [[spec-to-evidence-loop]], [[drift]], [[artifact-vault]]. Lesson map: [[lesson-0006b-the-hermes-control-plane]].
- **Durable architecture reference created (per prompt §4B):** canonical at `C:\Code\Hermes OS\docs\architecture\hermes-job-control-plane.md` (the governance repo), mirrored to `docs/hermes_os/architecture/hermes-job-control-plane.md` here (same convention as the five root-doc mirrors; re-copy on change). It is labeled a reference with proposed clarifications — PDR/ADRs win all conflicts.
- **Status discipline:** all claims graded **accepted / scaffolded / planned / proposed clarification / open decision / illustrative only** against the governance record; 0006a's implemented/seeded/planned continues to grade lab code only. Article III.9 amended accordingly (Article VII procedure).
- **Contradictions found and recorded, not resolved:** (1) ADR-0001 "typed job manifest" vs ADR-0006/0007/0012 "Job Envelope" — terminology split; (2) the course's **TaskSpec** (lesson 0007) has no governance counterpart; (3) ADR-0018 is titled a task-state policy but enumerates no states — the lesson's lifecycle is a proposed clarification. All three filed as routed items in the governance repo's `docs/open-decisions.md` (2026-07-30 rows) rather than settled silently. Also honored: ADR-0021's required wording — the Neo4j read-only projection is "config-soft, check-verified", never "enforced".
- **Integration:** pointer callouts added to lesson 0006 (extends the 0006a callout with the reading order 0006 §1 → 0006b → 0006a → rest) and 0006a (new callout before the version pin); lesson-0006 map note gained a 0006b blockquote; ROADMAP Phase 1 gained a second supplement line; module-graph note links the map; course-architecture.md gained the "two views, two records" note; exercise 05 README gained one sentence. No status or sequence changed — **0007 remains ▶**; no runtime code touched anywhere.
- **Defect found while validating (same procedure as 0006a's grep fix):** lesson 0006's shipped sequence diagram never rendered — headless-browser verification (Edge, vendored mermaid 11.16.0) showed a "Syntax error" bomb where the diagram should be. Root cause: a **semicolon inside the `Note over` text** ("No exception crossed; the supervisor…") — mermaid's lexer treats `;` as a statement separator even inside note text, so the remainder parsed as a new actor expecting an arrow (confirmed with `mermaid.parse`: *Expecting SOLID_ARROW…, got NEWLINE*). Fixed by replacing the semicolon with an em dash in `lessons/0006-the-model-gateway.html` and the twin diagram in `wiki/lessons/lesson-0006-the-model-gateway.md`; 0006 now renders flowchart + sequence cleanly (3× repeat runs). House rule earned: **no semicolons in unquoted Mermaid text** (sequence messages/notes, state labels); quoted flowchart labels are safe. All five 0006b diagrams and 0006a's three verified clean the same way (5× repeat runs each).

## Update 2026-08-08 — readability regime (user request: the lessons are unreadable)

The user reported lesson 0006 was barely finishable and 0006a impossible, and asked for an
ASD-STE100-compliant style plus consideration of the `no-ai-slop` plugin. Measurement confirmed a
monotonic drift across all eight shipped lessons: mean sentence length 15.6 → 27.0 words, body 1,339 →
7,217 words, em-dashes 26 → 185, sentences over 35 words 5 → 44.

- **The root cause is this workspace's own procedure**, not carelessness. Article VII answered every
  confusion report by amending an Article, and all nine Article III standards *add* required content.
  None limited length, sentence complexity, or vocabulary, so a confusion report could only ever produce
  more apparatus. Full argument: `wiki/course/course-pedagogy.md` row 14.
- **`docs/style/ste-profile.md` is binding** via new Article VIII. It is **derived from** ASD-STE100
  Issue 9 (15 Jan 2025) and **not compliant** — the ~900-word approved dictionary is ASD copyright and
  cannot be vendored here, and it targets aircraft maintenance procedures. Never describe it as
  compliant. **Open action:** request the free official Issue 9 copy from `asd-ste100.org` and reconcile
  the profile against it; until then no rule cites an ASD rule number.
- **`wiki/terms/` is now the Technical Names registry** — ASD-STE100's own mechanism for domain
  vocabulary, mapped onto infrastructure that already existed. A word is legal only if it is ordinary
  English, a registered term defined at first use in ≤20 words, or a literal `<code>` identifier. This
  is the rule that answers the user's main complaint.
- **`no-ai-slop` (Peter Yang, MIT) is vendored, not installed** — the plugin installs globally and this
  needed project scope. Rules at `docs/style/vendor/no-ai-slop.md`. Its *preserve voice*, *minimum
  effective edit* and *cut proportionally* principles are **rejected** for lessons: they are written for
  personal essays, and the word budget is the whole point. Its pattern list, banned words and two-mode
  (detect, then edit) workflow are adopted whole.
- **Article III.8 conflict decided by the user, 2026-08-08:** `no-ai-slop` bans summary-recap
  conclusions; III.8 requires the closing compression. The compression stays, bounded to 5 sentences ×
  25 words with no undefined terms. Lesson 0006a's 178-word "compression" fails and will be rewritten.
- **Constitution amended:** new **Article VIII**; III.7 changed from *deconfuse coinages* to *do not
  coin*; III.8 bounded; III.9 labels confined to one table; II.4 given a 2,000-word number; and **VII
  amended so a repair may subtract** — the ratchet now turns both ways.
- **Enforcement surfaces:** `.claude/skills/lesson-authoring/` auto-loads the profile on any lesson task,
  so no manual setup is required; `.claude/output-styles/lesson-prose.md` is opt-in per session with
  `keep-coding-instructions: true`, so engineering behaviour is untouched; `tools/lesson-lint.mjs` is
  **not built yet** — until it exists, check the mechanical rules by hand and say so. Never claim a lint
  that did not run.
- **Rewrite authorised.** The user explicitly asked for the shipped lessons to be rewritten, which is
  Article VII's explicit-user-request exception to "shipped lessons are history". Agreed scope: all eight
  lessons; 0006b demoted to a reference page under `docs/hermes_os/architecture/`; 0006 + 0006a re-cut
  into short lessons rather than translated sentence by sentence. **Not started.**
- A worked before/after sample of 0006a §2 sits at `.scratch/lesson-clarity/sample-0006a-section2.html`.
  It predates the profile's final section 6 and has not been rechecked against it.

## Update 2026-08-08 — supplement 0006a rewritten, the first test of the regime

- **0006a: 4,088 words and 60 errors → 1,320 words and 0.** It passes `tools/lesson-lint.mjs`. Retitled
  *What Counts as Policy*, because that is the one question it answers. Filename unchanged.
- **The rewrite cut scope, it did not compress prose.** Under Article VIII the budget forced real losses,
  and they are itemised in the new map note `wiki/lessons/lesson-0006a-what-counts-as-policy.md`: the
  nine-moment narrative (kept there as Diagram 2), the file-by-file layer stack and both call
  walkthroughs (reprise of lesson 0006), the ownership matrix (restated the five-category table), and the
  argument for provider-neutral types (belongs with the port, in lesson 0006). Four opening callouts of
  ~380 words became a footer.
- **Three terms now have a `<dfn>` at first use**, which they never had: [[hermes-policy]],
  [[composition-root]], [[routing-policy]]. That was the TERM-1 finding.
- **Three linter bugs were found by using it, and fixed:** `<button>` was not a block boundary, so four
  quiz options read as one 45-word sentence; markdown tables were not split into cells, so a table read
  as one 107-word sentence; and *wiring*, *routing*, *streaming* were treated as participles although
  this course uses them as nouns. Every lesson's warning count moved as a result. **Only the third fix
  changed a rule rather than a parser bug** — worth remembering, because tuning a linter until your own
  text passes is the failure mode here.
- **Two genuine violations in my own drafts were fixed in the text, not the tool:** a gerund clause
  opener (SENT-5) and the banned coinage "the three graphs" (TERM-2) in the map note.
- **Known linter gaps, recorded rather than left to be discovered.** Quiz `data-why` feedback lives in an
  HTML attribute, so the linter never sees it — in the old 0006a that was roughly 800 words of unchecked
  reader-facing prose. PARA-7 anchors on the phrase "keep only N sentences", so moving that phrase into a
  heading would hide the compression from the check. Both need fixing before the remaining rewrites.
- **Still to rewrite:** 0001 to 0006 and 0006b. 0006b is 6,669 words and 85 errors, and the agreed plan
  demotes it to a reference page rather than rewriting it as a lesson.

## Update 2026-08-08 — lesson 0006 rewritten (second test of the regime)

- **0006: 3,860 words and 60 errors → 1,992 words and 0.** It passes `tools/lesson-lint.mjs`, as do its
  map note and all four of its term notes. Title and filename unchanged.
- **The cut was scope, not diction.** Losses are itemised in the map note under *What the 2026-08-08
  rewrite cut*: the two supplement callouts (355 words before the first teaching sentence, now three
  footer lines), the above/below explanation that supplement 0006a now owns, two rows of the
  mock-versus-fake table, one classification item, and one say-it question.
- **Four `<dfn>` definitions added**, which the lesson never had: port, adapter, fake, dependency
  inversion. Each is 20 words or fewer at first use, and none of the four definitions depends on an
  undefined term.
- **Em-dashes went from 114 to zero.** Every one of them marked a second idea, so each became a sentence.
  The 2,000-word budget is what made that affordable.
- **The judgment rules were judged, not measured, and the calls are recorded** in the session's detect
  pass: metadiscourse (*"B3 deserves a slow look"*), fake-profound endings (*"That ignorance is the
  product"*), synonym cycling across *seam / line / boundary / contract*, and PARA-6 status labels moved
  inline-to-one-table. SENT-3 passive voice is still not implemented in the linter, so I read for it.
- **The apparatus is the binding constraint, not the prose.** Article III's required tables (layer,
  collision, signature, status), the new-vs-reprise list and the bounded compression cost about 500
  words. The quiz and classification prose costs about 600. That leaves roughly 900 words for the four
  concept sections, and the lesson only fit after two rounds of trimming. Any future Article that adds
  required content to a lesson should state which of these it displaces.
- **The map note and the four term notes were rewritten too**, because `docs/style/ste-profile.md` governs
  `wiki/**/*.md` and all five failed it. The term notes' `status` and `introduced` dates are untouched.
- **The linter cannot quote a banned coinage, even to say it was removed.** The map note originally listed
  the four deleted phrases by name and failed TERM-2 for it. The list now cites the profile instead. Worth
  knowing before writing any other removal record.
- **Not verified this session:** the two Mermaid diagrams were not re-rendered in a browser. Their source
  changed only in punctuation, and both blocks are free of semicolons (the 2026-07-30 house rule).
- **Still to rewrite:** 0001 to 0005, and 0006b. 0006b remains slated for demotion to a reference page.
- **Stray file, untouched:** an untracked duplicate of the old lesson sits at the repo root
  (`0006-the-model-gateway.html`). It is now stale. Delete it when convenient.

## Update 2026-08-08 — lesson 0007 shipped, the first lesson authored under the regime

- **0007 *The TaskSpec Is a Contract* + lab `06-taskspec`.** 1,893 words, 0 errors, 0 warnings from
  `tools/lesson-lint.mjs`. Its map note and all three term notes pass too. This is the first lesson
  written to Article VIII rather than retrofitted to it, and the budget was not the binding constraint —
  it landed 107 words under without cutting scope.
- **The user's `help_for_claude.md` was the brief.** Read it before authoring. Three new Technical Names
  only (`task-spec`, `admissibility-check`, `schema-refinement`), each with a `<dfn>` of 20 words or
  fewer at first use, against a budget of six. Zero em-dashes in prose. No coinages.
- **What the lesson teaches:** a schema for the *work* rather than for bytes off a wire; the parse as a
  dispatch gate; `.default()` splitting one schema into `z.input` and `z.output` types; and a refinement
  as the rule no single field can carry.
- **Every number in the lesson is measured, not asserted** (Article IV.2), against zod 4.4.3 and SDK
  0.113.0. The valid file's 5 keys become 7 after defaults fill. The job lands at 65 tokens. One bad file
  yields 3 rejections from one parse. `over-ceiling.json` is refused by the refinement at path
  `maxTokens` with code `custom`.
- **The strongest measurement was found by probing, not by design.** "Costs zero tokens" is easy to
  assert. The evidence is two independent facts: `fake.calls.length === 0`, and the mock's request
  counter not advancing across a whole Part B (Part A takes `req_mock_0001`, the next Part A takes
  `req_mock_0002`). Worth reusing whenever a lesson claims something did not happen.
- **A measured Zod fact that surprised me and is now taught:** a refinement does not run when any field's
  type fails. A spec missing `owner` *and* breaking the ceiling rule reports the `owner` issue alone, so
  one bad file can be refused in two rounds. Verified with a throwaway probe against 4.4.3.
- **Three files were carried into `06-taskspec` from `05-model-gateway` unchanged** (`gateway.ts`,
  `anthropic-gateway.ts`, `fake-gateway.ts`). That is the lesson's own claim about layering, so it had to
  be literally true, and the layer table cites it.
- **The linter's sentence splitter needs a capital after a full stop.** Two false-looking failures were
  real: a sentence beginning `<code>allowedTools</code>` and a compression sentence beginning
  `<code>.default()</code>` each glued onto the previous sentence and blew the word limit. Start a
  sentence with an ordinary word when the next token is a lowercase identifier.
- **Markdown list items lint as one block.** Six two-sentence bullets in the map note read as a 10
  sentence paragraph and failed PARA-1. One sentence per bullet is the safe shape.
- **Pre-existing debt paid, not deferred:** `wiki/course/course-module-graph.md` failed the profile with
  5 em-dashes and an over-length sentence. The write hook caught it on a routine status flip. It now
  passes. The hook is doing what it was built for.
- **Judged rather than measured, and recorded as required by VIII.6:** SENT-3 (passive voice) is not
  implemented in the linter, so I read for it. SENT-2, PARA-2, PARA-4, PARA-6, BAN-6, BAN-10 to BAN-14
  and BAN-18 were judged by eye. PARA-6's one status table sits at the end of section 4.
- **No test framework exists in `hermes-sdk-lab`, so `/tdd` had no seam to work at.** Verification is
  `pnpm typecheck` plus live runs of all three parts against the exercise 01 mock, which is the lab's
  established form. Introducing a test runner would have been a scope change, so I did not.
- **The two-axis review caught one factual error the linter never could.** "Part B refuses three files"
  appeared in the layer table and in quiz Q2. Part B refuses **two** (the third file is Part C's). A
  graded question carried a false premise. Fixed. This is the argument for running `/code-review` even
  when the lint is clean: the linter grades prose, not truth.
- **Two more accuracy fixes from the same pass.** "Three files arrive from exercise 05 unchanged" was not
  literally true, because header comments changed and the adapter's TODO banner was removed. The claim is
  now "no code changed in `gateway.ts` or in either implementation", which is verifiable. The lab README
  said "four files" where its own table said three.
- **Article III.1 (wire truth) was genuinely missing and is now paid.** The lesson claimed the spec's
  `maxTokens` reaches the wire without showing the exchange. I captured the real request with a throwaway
  logging server in the scratchpad, and §2 now carries it: `"max_tokens":1024` from a file that names no
  `maxTokens`. Code blocks do not count against the word budget, so wire truth is nearly free. Worth
  remembering when a budget feels tight.
- **An unresolved rule conflict, flagged rather than silently broken.** TERM-3 reserves Article III.5's
  collision table for words an *external* system overloads. "Contract" is overloaded three ways inside
  this course (responsibility ④, the port, the TaskSpec), and the lesson's own title uses it. The
  collision table stands, and the honest alternative is renaming two of the three. **User decision
  needed.**
- **`seeded` is banned by TERM-6 and required by Article III.9.** The status table uses it, because the
  constitution wins. Recorded so the next amendment can settle it.
- **The lab's TODO convention is inherited and questionable.** `task-spec.ts` carries a `TODO (Part B)`
  banner directly above the finished implementation, exactly as `05-model-gateway/src/anthropic-gateway.ts`
  does. Both reviewers read 05 as leaving its TODO open; it does not. Either the solutions belong in a
  separate branch or file, or the labels should stop saying TODO. **User decision needed.**
- **Still to rewrite:** lessons 0001 to 0005, and 0006b. 0006b remains slated for demotion to a reference
  page.
- **Blocking the lab's recursive typecheck:** `hermes-sdk-lab/02-model-client-sdk/src/cilent2.ts`
  (misspelled filename) has a syntax error at line 43 and was committed in `359dcc9`. It fails
  `pnpm --recursive typecheck` for the whole workspace. All six other exercises pass individually. Left
  untouched, because it is the user's file.

## Update 2026-08-08 — two rule conflicts resolved (user decision)

Lesson 0007's session reported two places where the rules contradict each other, rather than silently
picking a side. Both were defects in the rules, not the lesson. The user chose to fix both.

- **The status label was a banned metaphor.** TERM-6 bans metaphors for mechanisms and names *seeded*
  as a failing example; Article III.9 required *seeded* as a label. The constitution wins conflicts, so
  0007 used it and flagged it. **The label is now `prepared`.** First attempt was `reserved`, rejected
  because lesson 0006a already uses "reserved" for the model choice, and TERM-3 forbids the second
  meaning. Renamed in CLAUDE.md III.9, the profile's PARA-6, lessons 0006/0006a/0007, `COURSE.md` and
  `course-architecture.md`. TERM-6 keeps *seeded* as a banned example and records why the label moved.
- **"Contract" was overloaded three ways by the course itself.** TERM-3 reserves Article III.5's
  collision table for words an *external* system overloads; a word the course overloads by itself must
  be renamed. 0007 kept the collision table and said so. **Now: *contract* names one thing, the
  TaskSpec.** Responsibility (4) is the *request and response shape*; `gateway.ts` is *the port*.
  0007's three-row collision table is gone, replaced by four sentences. TERM-3 records the ruling.
- `wiki/terms/request-contract.md` keeps its slug so `[[request-contract]]` links survive; its `term:`
  is now *Request and response shape*, with the old name as an alias. Rename the slug when 0001 is
  rewritten.
- **Pending:** lessons 0001 to 0005 and 0006b still carry the old wording for both words. They are due
  for rewrite anyway, so the renames ride along at no extra cost. 0007 says so in the text.
- Verified after the change: 0006, 0006a and 0007 still lint clean, as do both lesson-map notes.
  `request-contract.md` fails with 2 errors, which are pre-existing and identical at HEAD.
- Older dated entries above, and `course-pedagogy.md` row 13, keep the word *seeded* as written. They
  are records of what was decided at the time, not current instructions.

## Update 2026-08-08 — scenario steps must be glossed (user report)

The user read the lessons and could not tell what `S1`, `S4` and the rest referred to. They are the nine
steps of the worked job in `wiki/course/hermes-integration.md`. Article II.2 required a lesson to *name*
its step and never to *explain* it, so 22 bare codes shipped across five lessons.

- **New rule TERM-7:** each distinct step appears once as `S4 (model calls)`, six words or fewer; later
  mentions may be bare. Added to the profile and to Article II.2.
- **The linter checks it**, reading prose blocks rather than raw HTML. Lesson 0006 has Mermaid nodes
  named `S1` and `S2`; a raw-source check would have flagged those as scenario steps.
- **Glossed now:** 0006 (S1, S4, S6, S7), 0006a (S4), 0007 (S1, S8). All three still pass.
- **The budget bit back, as predicted.** 0006 sat at 1,992 of 2,000 words with four glosses to add, so
  its mission callout was tightened by the words the glosses cost. It now sits at 1,995. Per amended
  Article VII the new rule records what it displaces.
- **Pending:** 0005 and 0006b hold the remaining bare codes and will gloss them when rewritten.

## Update 2026-08-11 — lesson 0008 shipped, and the shared mock learned tool use

Lesson 0008 (*Tool Use, the Loop's Heartbeat*) and lab `07-tool-loop` are in. 1,680 words, 0 errors,
6 warnings from `tools/lesson-lint.mjs`. Three new Technical Names (`tool_use`, `tool_result`, `tool
loop`) against a budget of six, zero em-dashes, two diagrams.

- **The mock server grew a tool branch, and that was the right place for it.** `01-raw-http/src/mock-server.ts`
  is shared by every exercise, and it already grew once per lesson (streaming in 03, drift in 04). The
  change is additive: no `tools` key means the old code path, byte for byte. Verified by re-running
  exercises 04 and 06 against it — 06 still reports 65 tokens and the same three rejections.
- **The mock cannot reason, so it always asks for the first declared tool** and invents arguments from
  that tool's own JSON Schema. Article IV.3 disclosure is in the lesson footer and the lab README.
- **Wire truth cost one throwaway proxy again.** A logging proxy on 8788 in front of the mock captured
  both requests of one iteration. The measurement that came out of it is the lesson's best number:
  `input_tokens` 23 on request 1, **110** on request 2, for the same job. That is what statelessness
  costs, and asserting it would have been weaker than showing it.
- **`z.toJSONSchema()` removed a whole section I had planned.** A tool needs two descriptions of its
  input: JSON Schema for the model, and a runtime check for Hermes. Zod 4.4.3 derives the first from the
  second, so the lab declares one schema per tool. That is lesson 0005's single-source-of-truth move at a
  third boundary, and it saved explaining why two copies were allowed to drift.
- **I broke the TODO convention deliberately.** 0007's session flagged `TODO (Part B)` banners sitting
  above finished code as confusing, and asked for a decision. No decision was recorded, so 0008 ships no
  TODO banner at all: the code is complete, and the exercise is five run-observe-modify steps in the
  README. If you prefer the old shape, say so and I will restore it.
- **The honest half of `allowedTools`.** The spec decides which tools are declared, so an unlisted tool
  never reaches the model. That is not enforcement, because the reply is model output and can name
  anything. `runTool` checks the name again, and Part B measures the refusal travelling back as a
  `tool_result` with `is_error` set. The approval gate is still lesson 0010's, and the status table says so.
- **Judged rather than measured, as Article VIII.6 requires:** SENT-3 (passive voice) is not implemented,
  so I read for it. SENT-2, PARA-2, PARA-4, PARA-5, PARA-6, TERM-2, TERM-3, TERM-5, TERM-6, BAN-6 to
  BAN-14 and BAN-18 were judged by eye. The six remaining SENT-5 warnings are all classification-exercise
  labels (*Choosing which tool to ask for…*). They are noun phrases naming a step, not clauses opening
  with a participle, so I kept them.
- **Pre-existing debt paid, not deferred:** `wiki/course/course-module-graph.md` failed TERM-7 with seven
  bare scenario codes on one line. It is now a table with a gloss per step, and it passes.
- **`pnpm --recursive typecheck` is still blocked** by `02-model-client-sdk/src/cilent2.ts` (misspelled
  filename, syntax error, committed in `359dcc9`). Exercise 07 typechecks on its own, as do 01 and 06.
  Still your file, still untouched.

### What the two-axis review caught, and what I did about it

The review ran before the commit and found five factual errors in shipped-quality prose. The linter
grades style, not truth, so this is the second lesson running where `/code-review` was the only thing
that could have caught them. All five are fixed.

- **An exercise step with no failure to read.** Step 6 tells you to delete the line that pushes the
  model's turn, then read the failure. There was none: the mock validated only the first message's role,
  so a `tool_result` answering nothing returned 200. The real API rejects that. The mock now enforces the
  pairing rule, and the step produces `request rejected (400): … tool_result "toolu_…" answers no
  tool_use in the preceding message`. That is a better step than the one I wrote.
- **An id nobody would ever see.** Both wire blocks quoted `toolu_mock_0004`, because I captured them
  through a proxy after four earlier requests. A fresh mock hands out `toolu_mock_0001`. Recaptured, and
  the README now says to restart the mock before comparing ids.
- **Cost attributed to the wrong thing.** I wrote that each call resends the transcript *and the tools
  array*, then offered 23 → 110 input tokens as the measurement. The mock estimates from `messages`
  alone, so that rise is the transcript only. Both facts are true and only one is measured, so the
  lesson now says which is which.
- **Two comments that contradicted the code.** `fake-gateway.ts` claimed "no change to its code" while
  carrying a new line, and `anthropic-gateway.ts` claimed no domain file *contains* the wire's strings
  when several comments do. Now: one line added and why, and no line of domain *code* says them.
- **"Iteration" meant two things.** Part A was "one iteration end to end" and reported `iterations: 2`.
  The report field is now `modelCalls`, the constant is `MAX_MODEL_CALLS`, and an iteration is one tool
  call answered. TERM-3 applies to code as much as to prose.

Three requested changes I declined, with reasons, so the next reviewer does not re-raise them:

- **`MAX_MODEL_CALLS` as scope creep into 0009.** A loop with no termination is not shippable. 0009 still
  owns budgets, deadlines and the `AbortController`. The constant's comment now says it exists to make
  the code correct rather than to teach budgeting.
- **Duplicate ④ in the mock.** That file already marks the request contract, `stream` and drift as ④,
  because they are all responsibility ④.
- **The classification exercise's gerund labels** (*Choosing which tool to ask for…*). They are the six
  remaining SENT-5 warnings. They name a step; they do not open a clause with a participle.

Two smells were worth fixing on their own merits. The Zod issue formatter had reached three copies, so
it moved to `issues.ts` and all three boundaries import it. And `defineTool` now closes over each tool's
own schema, so a tool body reads `input.graph` instead of coercing an unknown, with no type assertion
anywhere in the file.

## Update 2026-08-11 — lesson 0005 rewritten to the profile

The 2026-08-08 readability rewrite reached lesson 0005. It went from 2,917 words, 37 errors and 17
warnings to **1,997 words, 0 errors and 2 warnings**. Its four term notes and its lesson-map note were
rewritten with it, and all five now pass. Scope was not cut: the lesson still teaches the same five new
ideas and keeps both diagrams, the wire capture, the layer table, the signature table and the "parse"
collision table.

- **Where the 920 words went.** Metadiscourse first (*Account for the layers before reaching for the
  fix*, *Three measured facts to sit with*, *One overloaded word to pin down before it bites*), then
  reasons repeated below the table that already stated them, then the exercise arc restating the lab
  README. Nothing measured was dropped.
- **91 em-dashes to 0.** The limit is 2. Every one marked a second idea, so each became a sentence or a
  comma. The same pass removed 9 clause-joining semicolons.
- **The two renames of 2026-08-08 rode along, as planned.** *Contract* now names only the TaskSpec:
  responsibility ④ is the request and response shape, and the drifted wire block says "the API allows
  four words" rather than "the contract says". No status label needed renaming, because 0005 had no
  status table at all.
- **Article III.9 was unpaid here and is now paid.** The lesson referenced S1, S2 and Phase 1 capability
  with no labels anywhere. There is now one table of six rows near the end, three implemented and three
  planned, per PARA-6.
- **TERM-7 glosses added:** `S1 (the envelope is parsed)` and `S2 (evidence is checked)`. That clears two
  of the bare codes the 2026-08-08 note listed as pending. 0006b holds the rest.
- **One factual error found while rewriting, not by the linter.** The old §3 code block said the
  `ZodSafeParseResult` union was "10 lines" in `parse.d.cts`. It spans lines 3 to 13, and the block shows
  each member folded onto one line. The comment now says so.
- **A linter behaviour worth knowing before the next rewrite.** The sentence splitter needs a capital
  after a full stop, so a sentence opening with `z.infer`, `parse` or `[[a-wiki-link]]` merges into the
  one before it and reads as a single over-long sentence. Four SENT-1 errors were this, not real length.
  Start such sentences with an ordinary word.
- **Judged rather than measured, as Article VIII.6 requires:** SENT-3 (passive voice) is not implemented,
  so I read for it. SENT-2, PARA-2, PARA-4, PARA-5, PARA-6, TERM-2, TERM-3, TERM-5, TERM-6, BAN-6 to
  BAN-14 and BAN-18 were judged by eye. The two remaining SENT-6 warnings are *the two cannot drift
  apart* and *the check and the type cannot drift apart*, which are verb phrases rather than noun
  clusters, so I kept them.
- **Not touched:** the lab `04-validate-the-boundary` and its README. No lesson claim about them changed,
  and every number in the lesson still matches the README's measured table.
- **Still to rewrite:** lessons 0001 to 0004, and 0006b, which remains slated for demotion to a reference
  page.

## Update 2026-08-12 — lesson 0006's judgment pass, and the renames it had missed

The 2026-08-08 rewrite left 0006 mechanically clean. A detect pass over the rules the linter cannot
decide found 14 defects in the HTML, and the linter found 9 errors in the cluster the rewrite never
revisited. All are now fixed. The lesson holds at 1,993 words, and its map note and four term notes pass.

- **The renames of 2026-08-08 never reached 0006.** The pending list named lessons 0001 to 0005 and
  0006b, so 0006 looked done. It still called the port a *contract* in four places, and `fake.md` in two
  more. *Contract* now names the TaskSpec alone here too. Responsibility ④ reads *the request shape*.
  Check a lesson's whole cluster after a rename, not the file the lint command names.
- **Three banned metaphors survived a rewrite that was looking for them.** *One seam fixes all three*,
  *the supervisor's kill switch*, and *a bug must stay loud*. The fourth was *the network cannot see
  build-time architecture*, which TERM-6 quotes almost verbatim as a failing example. The lesson now says
  TypeScript erases the port before the adapter builds the request.
- **The circled numbers were unreadable, and the user chose to pay for a key.** `①–⑥` and `②③④` are
  lessons 0002 and 0003's notation, glossed nowhere in 0006. The layer table's first row now names all
  six, and the `⑤` feedback reads *errors*. TERM-7 exists for bare `S4`; the same defect in a different
  notation is not checked.
- **The budget paid for it, as amended Article VII requires.** The key and the four rewritten sentences
  cost about 16 words. Two deletions covered them: *read it as a supervisor would*, and *It changes less
  than that claim suggests, so read the layers first*. Both were reader guidance under BAN-13.
- **`wiki/terms/model-gateway.md` is still broken and is out of scope.** 3 errors and 2 warnings: two
  sentences of 39 and 38 words, 3 em-dashes, 2 clause-joining semicolons, *property of the seam*, and
  *keeps the contract honest*. It carries `lesson: "0001"`, so the 0006 rewrite never touched it, but
  most of its body is about 0006. It needs a rewrite when 0001 does.
- **The per-edit lint hook reports intermediate states.** Fixing two errors in one file with two Edit
  calls makes the first call fail loudly. Re-run the linter before believing it.
- **Judged rather than measured, per Article VIII.6:** SENT-3 is not implemented, so I read for passive
  voice. SENT-2, PARA-2, PARA-4, PARA-5, PARA-6, TERM-1, TERM-2, TERM-3, TERM-5, TERM-6, BAN-6 to BAN-14
  and BAN-18 were judged by eye. Two calls went the other way and are recorded here. The classification
  items keep the passive, because naming the actor answers the exercise. *The line*, *the port* and *the
  boundary parse* stay, because the lede asks where the line goes and section 2 answers with the port.
- **Two defects surfaced during the edit pass, not the detect pass**, both in `fake.md`: *altitude* for
  the layer, and *policy tests shed the network*. Fixed under TERM-6 rather than deferred.
- **Not touched:** the lab `05-model-gateway`, `ROADMAP.md` and `course-module-graph.md`. No status
  changed and no lesson claim about the lab changed.

### The eight notes lesson 0006 links, rewritten the same day (user request)

The four term notes of a lesson are not the whole reading path. Lesson 0006's cluster links eight more
notes through its `**Related:**` lines, and seven of them failed the profile. All eight pass now:
`model-gateway`, `base-url`, `type-erasure`, `typed-error`, `sdk`, `test-double`, `cancellation`, and
`safe-parse`, which lesson 0005's rewrite had already fixed. 16 errors and 7 warnings to 0 and 1.

- **`model-gateway.md` was the worst note in the registry and the most read.** 39-word and 38-word
  sentences, 3 em-dashes, 2 clause-joining semicolons, *property of the seam*, and *keeps the contract
  honest*. It carries `lesson: "0001"`, which is why three passes over lesson 0006 skipped it while most
  of its body described lesson 0006.
- **Five more banned metaphors, all in notes written before the profile existed:** *the same seam* and *a
  deliberately designed seam* in `base-url`, *an SDK you can't see through is magic* twice in `sdk`, *the
  ancestor of* and *one altitude up* in `test-double`, and *the transport tears the request down* with
  *the SDK plumbs it* in `cancellation`. Each is now a statement of what the code does.
- **The rename reached four more notes.** *Contract* is gone from `test-double` and `base-url` as a name
  for an interface. `test-double` now links `[[request-contract|request and response shape]]`, which
  keeps the slug alive and shows the new name.
- **TERM-7 in a term note, not just a lesson.** `cancellation.md` now reads `S6 (budget limits)`, and
  `⑥` is glossed as cancellation where the note cites it.
- **One warning kept on purpose.** `cancellation.md` opens with *Stopping an in-flight request on
  purpose*. SENT-5 bans a participle that opens a clause. This is a noun phrase defining a noun, which
  is the house form for every definition line in `wiki/terms/`. Changing it would change 56 notes.
- **Frontmatter untouched in all eight.** No `status`, `introduced` or `demonstrated` date moved. This
  was a prose rewrite, and Article V.2 governs promotion.
- **Where the next hop stops, and why it should wait.** Those eight notes link 13 more that still fail,
  23 errors between them: `api`, `messages-api`, `api-key-authentication`, `api-version-header`,
  `request-contract`, `error-boundary`, `retry-with-backoff`, `request-options`, `declaration-file`,
  `narrowing`, `discriminated-union`, `runtime-validation` and `stop-reason`. They belong to lessons 0001
  to 0004, which are themselves unrewritten. `request-contract.md` is the clearest case: the 2026-08-08
  entry schedules its slug rename for when lesson 0001 is rewritten. Rewriting these notes first would
  put them out of step with the lessons that introduce them.

## Update 2026-08-15 — lesson 0009 shipped: the loop gets its bounds, and the gateway streams

Lesson 0009 (*Bounds and Termination*) continues lab `07-tool-loop` with Parts D–F. 1,974 words, 0
errors, 6 warnings from `tools/lesson-lint.mjs`; the map note and both term notes pass with 0/0. Two new
Technical Names against a budget of six: `termination` and `partial-artifact`. Zero em-dashes in prose,
two diagrams, both render-verified in headless Edge against the vendored mermaid.

- **The design decision of the session: the gateway now streams every call.** A bound checked only after
  a reply lands cannot stop the reply, and S6's "abort mid-generation" is unachievable on the JSON path.
  The adapter moved from `messages.create` to `messages.stream` + `finalMessage()`; the boundary parse
  runs on the assembled Message unchanged. `requestId` now comes from `stream.request_id` (the 0004
  finding that `finalMessage()` carries no `_request_id` paid off here).
- **The mock's streaming path learned tool use** — the same decision as its JSON tool branch, delivered
  as SSE with real grammar (`content_block_start` type `tool_use`, then `input_json_delta` chunks). The
  change is additive: no-tools streams are frame-identical to before. Regressions re-run: exercise 03
  (all parts, incl. the 41/164-char abort), 04 (drift), 06 (65 tokens), and 07 Parts A–C (217/95/65).
  The pairing-rule 400 fires before the stream branch, so 0008's exercise step 6 still works.
- **Every bound now comes from the spec.** `MAX_MODEL_CALLS` is gone; `maxModelCalls` (default 4) and
  `deadlineMs` (default 60000) joined the schema, both defaulting so a silent spec still terminates.
  `costCeilingTokens`, declared in 0007, is enforced at three moments: before a call (refuse to start),
  during (abort on estimate), after (book truth). Outcomes gained `over_budget` and `out_of_time`.
- **The user's 2026-07-27 carry-forward became the lesson's spine.** They derived after lesson 0004 that
  in-stream budget aborts must act on a conservative estimate because true `output_tokens` arrive only
  in `message_delta`. The mission callout quotes the prediction back; the wire section proves it with
  captured frames (`message_start` carries `input_tokens: 110` truth, `message_delta` carries
  `output_tokens: 42`, an aborted call receives neither). Estimator: one token per three chars, erring
  high on purpose.
- **Measured, not asserted:** Part D's fake was scripted for 3 asking replies and answered 2; Part E
  aborted at 46/82 chars and booked 191 estimated tokens against a ceiling of 190 (the honest overshoot
  is taught, not hidden); Part F's 2400 ms deadline landed at ~2424 ms with 24 chars kept. The port
  gained `CallProgress` (a third `kind`-discriminated union) and `partialText` on the aborted arm.
- **One `AbortController` per job serves every bound**; `AbortSignal.any` merges it with the operator's
  signal. The supervisor tracks `boundHit` because the abort itself cannot say why it fired — quiz Q3.
- **Recall debt from TWO lessons paid.** The user's say-it answers for lessons 0007 (record 0010) and
  0008 (record 0011) sat uncollected-into-evaluations; both sets are correct at mechanism level, and the
  0007 answer on refinement placement literally predicted this lesson's enforcement design. Evaluations
  appended to both records; **promoted to `demonstrated` (6):** [[task-spec]], [[admissibility-check]],
  [[schema-refinement]], [[tool-use-block]], [[tool-result-block]], [[tool-loop]].
- **Judged rather than measured, per Article VIII.6:** SENT-3 (passive) read by eye; SENT-2, PARA-2,
  PARA-4, PARA-5, PARA-6, TERM-2, TERM-3, TERM-5, TERM-6, BAN-6 to BAN-14 and BAN-18 judged. The six
  SENT-5 warnings are classification labels (*Refusing to start a call…*) — noun phrases naming a
  check, the same kept pattern as 0008's.
- **Ops notes:** verification ran on a private mock (`PORT=8899`) plus a logging proxy on 8898; both
  stopped afterwards, nothing holds 8787. A first proxy draft died on Node 22's `req.on("close")`
  firing at body-end — teeing SSE needs `res.on("close")` + `writableFinished`. The per-edit lint hook
  again reported intermediate states mid-fix; the fresh linter run is the truth.
- Still your file, still untouched: `02-model-client-sdk/src/cilent2.ts` keeps `pnpm -r typecheck` red.
- Bookkeeping: ROADMAP row 0009 ✅ with the streaming win named, 0010 flipped to ▶; module graph synced
  (phase banner, Phase 1 detail, artifact graph, S6 row).

## Workspace conventions

*(Kept for history and detail; where anything below conflicts with CLAUDE.md — the constitution since 2026-07-25 — CLAUDE.md wins.)*
- Lessons: `lessons/NNNN-name.html`, linked to `../assets/course.css` + `../assets/quiz.js`.
- Glossary wiki: one note per term in `wiki/terms/<slug>.md`. Frontmatter: `term`, `aliases`, `type: glossary-term`, `lesson` (zero-padded string), `phase`, `category` (`protocol` / `sdk-layer` / `type-system` / `validation` / `hermes`), `status` (`introduced` → `demonstrated`), `introduced` / `demonstrated` dates, `tags` (= `glossary` + category; drives graph color groups in `.obsidian/graph.json`). Body: definition, lesson context, Hermes relevance, `[[related]]` links. Full schema and DataView indexes: `wiki/GLOSSARY.md`.
- Per-lesson wiki map: `wiki/lessons/lesson-NNNN-<short-name>.md` (`type: lesson-map`) — links the lesson's term cluster, holds its Mermaid diagrams in markdown form, DataView table of the lesson's terms. **Authoring a new lesson now includes:** its lesson-map note + term notes at `status: introduced` + at least one supplementary Mermaid diagram in the HTML.
- Mermaid in HTML lessons: add `<script src="../assets/vendor/mermaid.min.js" defer></script>` and `<script src="../assets/mermaid-init.js" defer></script>` to the head; mark diagrams up as `<figure class="diagram"><pre class="mermaid">…</pre><figcaption>…</figcaption></figure>`. Wiki notes use plain ```mermaid fences — Obsidian renders them natively.
- Assets are reusable components — check `assets/` before authoring anything new.
- Hermes OS background lives at `C:\Code\Hermes OS\.scratch` (PRDs, grill decisions, wave issues).
