# 04-validate-the-boundary — the assertion becomes a checked parse

The companion lesson is [`lessons/0005-validate-the-boundary.html`](../../lessons/0005-validate-the-boundary.html) — read it first; this file is just the command reference.

## Setup

The workspace install covers this exercise (it adds one dependency: `zod`, pinned at **4.4.3** — every claim below was verified against exactly that version). If you haven't installed since the lab gained this exercise, run from the **lab root** (`hermes-sdk-lab/`):

```powershell
pnpm install
```

## Run

Two terminals, both in `hermes-sdk-lab/04-validate-the-boundary/`:

```powershell
pnpm mock       # terminal 1 — exercise 01's mock server, now able to let its contract drift
pnpm request    # terminal 2 — your client (src/client.ts)
```

(`pnpm mock` runs `../01-raw-http/src/mock-server.ts` — same server, same port 8787, same gates ②③④. A request carrying the `x-mock-scenario: drift` header gets a `200` whose **body shape has quietly changed**: `usage.output_tokens` arrives as a string, `stop_reason` as `"end-turn"`. JSON path only — exercises 01–03 behave exactly as before; both were re-run as a regression check after the mock gained this scenario.)

Work through `src/client.ts` top to bottom — Part A is given (run it first and just watch), Parts B and C are the exercise. **Watch both terminals**: the mock announces when it lies. Your job is a client that notices without being told.

## What to observe — measured against this mock (zod 4.4.3)

| Experiment | Expected result |
|---|---|
| A: `as MessageResponse` on the drifted body | No error anywhere. `typeof output_tokens` prints `string` while TypeScript says `number` |
| A: the ledger `input_tokens + output_tokens` | `"1142"` — string concatenation of `11 + "42"`. Actual spend: 53 tokens. Ledger claims 1142 |
| A: `spent > 1000` (the budget ceiling check) | `true` — a phantom ceiling breach. In Phase 1 this fires an abort that should never fire |
| B: `MessageSchema.safeParse(body)` on the same bytes | `success: false` — **2 issues from one parse** (Zod collects; it does not stop at the first lie) |
| B: the issues, with paths | `stop_reason`: `[invalid_value] Invalid option: expected one of "end_turn"\|"max_tokens"\|"stop_sequence"\|"tool_use"` · `usage.output_tokens`: `[invalid_type] Invalid input: expected number, received string` |
| B: `z.prettifyError(result.error)` | The same two issues as a human-readable block: `✖ …` lines with `→ at stop_reason` / `→ at usage.output_tokens` |
| C: clean wire, `safeParse` succeeds | `result.data` is typed with **no `as` anywhere** — ledger prints 53, `typeof spent` prints `number`, ceiling check `false` |
| C: `Object.keys(body)` vs `Object.keys(result.data)` | Wire: 9 keys / usage: 4 keys. After the parse: 7 keys / usage: 2 — unrecognized keys are **stripped**; only the declared shape crosses the boundary |

Then ask of each row: which layer caught it — the compiler, an HTTP gate, the parse, or nothing at all?

## Notes

- The drift is invisible to every layer built in exercises 01–03: the compiler is gone at runtime (types are erased), the HTTP status is a healthy `200`, and both exercise 01's `as` and the SDK's declared return types are *assertions*. Only a runtime check at the boundary can catch it — that is the whole lesson.
- `stop_reason` shows the schema carrying **more** contract than the old type: exercise 01's interface said `string`, so `"end-turn"` would have passed even a hypothetical runtime type-checker. `z.enum([...])` encodes the *contract's* four words, not JavaScript's string.
- Zod is pinned exact (`4.4.3`, no `^`) — schema-library APIs drift too, and this exercise's outputs (issue codes, `prettifyError` formatting) are version-specific.
- Everything here stays mock-first: no live API calls, no credentials.
