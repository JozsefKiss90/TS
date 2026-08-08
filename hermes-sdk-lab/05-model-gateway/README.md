# 05-model-gateway — the SDK goes behind a port

The companion lesson is [`lessons/0006-the-model-gateway.html`](../../lessons/0006-the-model-gateway.html) — read it first; this file is just the command reference.

**Architecture context:** the supplement [`lessons/0006a-hermes-architecture-primer.html`](../../lessons/0006a-hermes-architecture-primer.html) places this exercise inside the full Hermes Spec-to-Evidence Loop and labels what exists here versus what later Phase 1 lessons add — read it after Part A (or right after the lesson). Honest scope: this exercise contains a one-call policy **seed** (`superviseOneCall` classifies a single model-call result); it has **no** routing engine, no complete supervisor, no budget or permission system, and no durable trace — the model id is fixed wiring in `main.ts`, and only the `requestId` field is seeded for the future trace. Compact reference: [`wiki/course/course-architecture.md`](../../wiki/course/course-architecture.md). For the system this seam ultimately serves — the Hermes OS job control plane, from its governance record — read supplement [`lessons/0006b-the-hermes-control-plane.html`](../../lessons/0006b-the-hermes-control-plane.html): in the real Wave-1 audit slice, a gateway like this one is the *last* organ introduced, not the first.

## Setup

The workspace install covers this exercise (`@anthropic-ai/sdk` ^0.113.0 — verified against **0.113.0** installed — and `zod` pinned exact **4.4.3**, same as exercise 04). If you haven't installed since the lab gained this exercise, run from the **lab root** (`hermes-sdk-lab/`):

```powershell
pnpm install
```

## The files are the lesson

Read them in this order — the import lines matter as much as the code:

| File | Side of the port | Imports the SDK? |
|---|---|---|
| `src/gateway.ts` | the **port** — Hermes-owned types, given | no |
| `src/supervisor.ts` | **policy above** — domain code, given | no |
| `src/anthropic-gateway.ts` | **mechanics below** — the adapter; error classification is **TODO Part B** | yes (translation) |
| `src/fake-gateway.ts` | the port's second implementation — **TODO Part C** | no |
| `src/main.ts` | wiring — constructs clients and adapters, runs the parts | yes (wiring only) |

The dependency-direction check: `grep -r "@anthropic-ai/sdk" src/` must hit exactly two files — the adapter and `main.ts`. If it ever hits `supervisor.ts` or `gateway.ts`, the port has been breached.

## Run

Two terminals in `hermes-sdk-lab/05-model-gateway/`:

```powershell
pnpm mock       # terminal 1 — exercise 01's mock server, unchanged (port 8787)
pnpm job a      # terminal 2 — Part A (given): one job through the port
pnpm job b      # Part B: failures as data — crashes until you finish classifyFailure
pnpm job c      # Part C: the fake — STOP THE MOCK FIRST (Ctrl+C in terminal 1)
```

## What to observe — measured against this mock (SDK 0.113.0, zod 4.4.3)

| Experiment | Expected result |
|---|---|
| A: clean call through `AnthropicModelGateway` | `{ outcome: 'landed', tokensSpent: 53, notes: ['stop: completed', 'request: req_mock_0001'] }` — the wire's `end_turn` never reaches the supervisor; Hermes's `completed` does |
| B before the TODO | `pnpm job b` **crashes**: a raw `RateLimitError` escapes the port — exactly what the gateway exists to prevent |
| B1: `x-mock-scenario: rate-limit` + `maxRetries: 0` | `{ outcome: 'retry_later', tokensSpent: 0, notes: ['provider asked for 5000 ms of backoff'] }` — the wire's `retry-after: 5` (seconds) crossed the port as `retryAfterMs: 5000`, data |
| B2: abort at 100 ms (mock "thinks" ~400 ms) | `{ outcome: 'gave_up', notes: ['aborted by the operator'] }` — `APIUserAbortError` became `{ kind: 'aborted' }`; no try/catch anywhere in the supervisor |
| B3: `x-mock-scenario: drift` (exercise 04's lying 200) | `{ outcome: 'gave_up', tokensSpent: 0, notes: ['reply refused at the boundary', 'stop_reason: [invalid_value] …', 'usage.output_tokens: [invalid_type] …'] }` — the same bytes that ledgered `"1142"` in exercise 04 Part A are now refused **inside the adapter**; the supervisor counts 0 |
| C with the mock **stopped** | `pnpm job c` runs green in **~0.6 ms**: C1 is byte-identical to A's report except `request: (none)`; C2 exercises the retry-later **policy branch** with a scripted throttle — no server, no network, no tokens |
| C: `fake.calls` | `[{ prompt: 'Hello, Claude!', maxTokens: 100 }, { prompt: 'Hello again', maxTokens: 100 }]` — the fake records what the domain asked, so tests can assert on it |

## Notes

- The wire is **unchanged**: watch the mock's terminal during Part A — the same `POST /v1/messages`, the same gates ②③④ as exercise 01. The port is compile-time architecture; it adds zero bytes to the exchange.
- The adapter's `WireReplySchema` is deliberately narrower than the SDK's `Message` (lesson 0005 §4's rule: validate what the client consumes). `stop_reason` is non-nullable here — `null` belongs to lesson 0004's streaming skeleton, and a *finished* reply must commit.
- The provider-neutrality decision landed in this lesson: **neutral port, one live adapter**. Nothing in `gateway.ts` names a provider; the fake is the second implementation that keeps it honest. Building a second live adapter now would serve no requirement.
- Everything stays mock-first: no live API calls, no credentials.
- Ops reminder (third occurrence!): a `pnpm mock` left running from a previous session serves **old** code and holds port 8787. If anything misbehaves, check for a stale mock before debugging.
