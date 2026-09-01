# 08-tested-adapters — the whole loop runs green, offline

One lesson owns this exercise: lesson 0012, [`0012-offline-by-construction.html`](../../lessons/0012-offline-by-construction.html) — Phase 1's capstone. Nothing here adds a feature. The exercise proves the features exercise 07 already has, with no model, no key, and no process listening on any port. Read the lesson first; this file is the command reference and the measured results.

## Setup

From the **lab root** (`hermes-sdk-lab/`):

```powershell
pnpm install
```

This adds one dev dependency to the workspace: `vitest` (verified against **3.2.7** installed). `@anthropic-ai/sdk` ^0.113.0 and `zod` 4.4.3 are the same pins as exercise 07.

## The files are the lesson

| File | What it is | New? |
|---|---|---|
| `src/replay.ts` | the fixture schema, the loader (a parse — bytes on disk stay untrusted), and `replayFetch`: a scripted `fetch`, like the fake gateway one level lower | **new** |
| `src/record-fixtures.ts` | how the fixtures were made: the real adapter, run against the exercise 01 mock through a recording `fetch` | **new** |
| `fixtures/*.json` | five recorded exchanges: the audit job's two calls, a 429, a 401, and one derived tamper | **new** (committed — the tests need them; `traces/` stays gitignored, fixtures do not) |
| `tests/task-spec.test.ts` | the admission gate: defaults, both refinements, garbage in | **new** |
| `tests/trace.test.ts` | the trace reader and the resume rebuild, against strings | **new** |
| `tests/supervisor.test.ts` | every loop policy under the fake: tools, refusals, cap, ceiling, both denials, approval, trace order, resume round trip | **new** |
| `tests/replay.test.ts` | the replay seam itself, with an inline exchange | **new** |
| `tests/adapter.test.ts` | the adapter's three translations under recorded fixtures | **new** |
| `tests/loop-offline.test.ts` | the capstone: Part A's whole job through the real adapter, no network | **new** |

No file in `07-tool-loop/` changed. The tests import exercise 07's sources directly (`../../07-tool-loop/src/…`), so they check the same files `pnpm job` runs — a copy would be a second loop that could silently diverge.

## Run

One terminal in `hermes-sdk-lab/08-tested-adapters/`, and deliberately **no mock terminal**:

```powershell
pnpm test          # all six suites, no process listening anywhere
pnpm test:watch    # the same, re-run on every file save
pnpm typecheck     # tsc across this package AND the 07 sources it imports
```

To re-record the fixtures (only needed after a mock or adapter change):

```powershell
$env:PORT='8899'; pnpm mock                              # terminal 1 — restart it fresh,
                                                         # so request ids start at 0001
$env:ANTHROPIC_BASE_URL='http://localhost:8899'; pnpm record   # terminal 2
git diff fixtures/                                       # only recordedAt should change
```

## What to observe — measured (SDK 0.113.0, zod 4.4.3, vitest 3.2.7)

| Experiment | Measured result |
|---|---|
| `pnpm test`, no mock running | 6 files, **29 tests, all green, ~12 s** — the client's `baseURL` is `http://offline.invalid`, so any test that reached for a socket would fail |
| the capstone's report | `outcome: 'landed'`, `modelCalls: 2`, `toolRuns: ['graph_health → ran']`, `tokensSpent: 217` — the numbers lesson 0008 Part A measured live, reproduced from bytes |
| the capstone's second request | **byte-identical** to the recorded one: the supervisor regenerated it from the replayed reply, pairing id and tool output included |
| the capstone's trace | the eight events lesson 0011 Part J counted, in the same order, via an in-memory `TracePort` |
| the recorded 429 | `{ kind: 'throttled', retryAfterMs: 5000 }` — from the fixture's `retry-after: 5` header, with `maxRetries: 0` so the SDK classifies instead of retrying |
| the derived tamper | `drifted-stop.json` carries `"stop_reason":"end-turn"`; the adapter answers `malformed_reply` naming `stop_reason` — lesson 0005's refusal, reading a fixture instead of a socket |

## Steps

1. Run `pnpm test` **before** starting any mock. Green. That is the exercise's claim, demonstrated before it is explained.
2. Read `tests/supervisor.test.ts` next to `tests/adapter.test.ts` and say, for three tests each, what each one can prove that the other cannot. The suite headers state the split; check them against the assertions.
3. Open `fixtures/tool-ask.json`. Find the three places one value appears: the tool's schema in the request, the invented arguments in the response's `input_json_delta` frames, and the pairing id the next fixture's request must carry.
4. Tamper: in `fixtures/tool-answered.json`, change `\"output_tokens\":42` (inside the escaped SSE body) to `\"output_tokens\":\"42\"` and run `pnpm test`. Exactly one test fails — the capstone, whose call 2 now ends `gave_up` with `reply refused at the boundary`. The layer that refused is the adapter's boundary parse, not the test. Restore with `git checkout -- fixtures/` (or re-record).
5. Break the loop on purpose: in `07-tool-loop/src/supervisor.ts`, comment out the `transcript.push({ from: "model", … })` line and run `pnpm test`. Measured: **3 tests fail across 2 suites** — the two supervisor transcript assertions, and the capstone's byte comparison, because the regenerated request no longer matches the recorded one. That is the drop-the-turn bug the mock's pairing rule catches live, caught from bytes. Revert.
6. Re-record per the commands above and `git diff fixtures/`. Everything but `recordedAt` reproduces byte-for-byte, which is what makes the byte assertions honest rather than lucky.

## What these tests cannot prove — said out loud

- **Mid-generation timing.** A replayed stream arrives whole, so the budget abort's 46-of-82-chars moment (lesson 0009 Part E) and the deadline race (Part I) stay live-mock territory. The fake answers instantly for the same reason.
- **The real provider's contract.** The fixtures freeze the *mock's* behavior, and the mock's error wording is an approximation. If Anthropic drifts, every test here stays green — only a live run against the real API would notice. Pinning that gap is Phase 4's job (golden tasks against recorded *and* live runs).
- **A human's judgment.** Part H's terminal approval is scripted here (`scriptedApprover`). The port is proven; the operator is not simulated.
