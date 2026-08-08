# 06-taskspec — no spec, no dispatch

The companion lesson is [`lessons/0007-the-taskspec-is-a-contract.html`](../../lessons/0007-the-taskspec-is-a-contract.html) — read it first; this file is the command reference and the measured results.

## Setup

The workspace install covers this exercise (`@anthropic-ai/sdk` ^0.113.0 — verified against **0.113.0** installed — and `zod` pinned exact **4.4.3**, same as exercises 04 and 05). If you have not installed since the lab gained this exercise, run from the **lab root** (`hermes-sdk-lab/`):

```powershell
pnpm install
```

## The files are the lesson

Three files arrive from exercise 05 with no code change. One is new, and two are rewritten. Read the new one against the shape of the old ones — the resemblance is the point.

| File | What it is | New? |
|---|---|---|
| `src/gateway.ts` | the port — the contract for a model **call** | no, from 05 |
| `src/anthropic-gateway.ts` | the adapter — mechanics below the port | no, from 05 (its Part B TODO banner is gone, the code is identical) |
| `src/fake-gateway.ts` | the port's second implementation; `calls` is Part B's evidence | no, from 05 |
| `src/task-spec.ts` | the contract for the **work**, plus the admission gate — **TODO Part B** | **yes** |
| `src/supervisor.ts` | `runTask(gateway, spec)` — takes a spec where 05 took a loose prompt | rewritten |
| `src/main.ts` | wiring and the three parts | rewritten |
| `specs/*.json` | four job files: one valid, three not | **yes** |

`task-spec.ts` imports `zod` and nothing else. `gateway.ts` does not import it, and it does not import `gateway.ts`. They are two boundaries, and they stay two files.

## Run

Two terminals in `hermes-sdk-lab/06-taskspec/`:

```powershell
pnpm mock       # terminal 1 — exercise 01's mock server, unchanged (port 8787)
pnpm job a      # terminal 2 — Part A: an admitted spec runs the job
pnpm job b      # Part B: bad specs refused — watch terminal 1 stay silent
pnpm job c      # Part C: the cross-field rule (no mock needed)
```

## What to observe — measured against this mock (SDK 0.113.0, zod 4.4.3)

| Experiment | Measured result |
|---|---|
| A: `audit-atlas.json` admitted | the file carries **5** keys, the admitted spec has **7** — `maxTokens: 1024` and `allowedTools: []` were filled by the schema, so the parsed value is the contract rather than the file |
| A: the job runs | `{ task: 'Audit the atlas graph', outcome: 'landed', tokensSpent: 65, notes: ['stop: completed', 'request: req_mock_0001', 'ceiling declared: 2000 tokens', 'tools permitted: (none)'] }` — `maxTokens` reached the wire from the spec, not from a literal in `supervisor.ts` |
| B: `no-owner.json` | **3 rejections from one parse** — `title: [too_small]`, `owner: [invalid_type] … received undefined`, `costCeilingTokens: [invalid_type] expected number, received string`. Zod does not stop at the first |
| B: `not-a-spec.json` (a JSON array) | `(root): [invalid_type] Invalid input: expected object, received array` — the path is empty, so the formatter prints `(root)` |
| B: what it cost | `model calls made: 0 — tokens spent: 0`. Stronger evidence, against a **fresh** mock: Part A takes `req_mock_0001`, then a full Part B runs, and the next Part A takes `req_mock_0002`. The counter did not move during Part B, because no request reached the server |
| C: `over-ceiling.json` | `maxTokens: [custom] maxTokens may not exceed the job's costCeilingTokens` — every field in that file has a valid type; the **pair** is what fails |
| C: ordering | a spec that is missing `owner` **and** breaks the ceiling rule reports the `owner` issue only. Refinements run after every field's type passes, so a bad file can be rejected twice, in two rounds |

## Notes

- **The gate is a type, not a convention.** `runTask` asks for a `TaskSpec`, and the only way to obtain one is a successful parse. A caller cannot skip admission and still compile. `admitTaskSpec` takes `unknown` for the same reason: `JSON.parse` returns `any`, and `any` would let the check be skipped silently.
- **`.default()` gives the schema two static types.** `z.input<typeof TaskSpecSchema>` allows a file without `maxTokens`; `z.output` does not. Exercise 04's schema had one type because it had no defaults, and `z.infer` is an alias for `z.output`. `main.ts` Part A has a commented line — uncomment it and read the error.
- **`allowedTools` defaults to empty, not to permissive.** The default for a permission list is the one that grants nothing. Lesson 0010 enforces it; today the field only has to be declared and carried.
- **`costCeilingTokens` is recorded, not enforced.** The report prints the ceiling the job ran under. The `AbortController` that acts on it arrives in lesson 0009.
- **The `path` on a refinement is a choice.** Without `path: ["maxTokens"]` the issue lands at the root, which is true and useless. With it, the rejection names a field an operator can edit.
- Everything stays mock-first: no live API calls, no credentials.
- Ops reminder: a `pnpm mock` left running from a previous session serves **old** code and holds port 8787. Check for a stale mock before debugging anything odd.
