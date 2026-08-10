# 07-tool-loop — one call becomes a loop

The companion lesson is [`lessons/0008-tool-use-the-loops-heartbeat.html`](../../lessons/0008-tool-use-the-loops-heartbeat.html) — read it first; this file is the command reference and the measured results.

## Setup

The workspace install covers this exercise (`@anthropic-ai/sdk` ^0.113.0 — verified against **0.113.0** installed — and `zod` pinned exact **4.4.3**, same as exercises 04 to 06). If you have not installed since the lab gained this exercise, run from the **lab root** (`hermes-sdk-lab/`):

```powershell
pnpm install
```

## The files are the lesson

| File | What it is | New? |
|---|---|---|
| `src/gateway.ts` | the port — now carries a transcript, tool declarations, and the model's tool calls | rewritten |
| `src/anthropic-gateway.ts` | the adapter — translates `Turn[]` to `messages[]` and back | rewritten |
| `src/tools.ts` | the catalogue: what Hermes can run, and the two checks before it runs | **new** |
| `src/issues.ts` | one Zod issue formatter, now that three boundaries want the same three lines | **new** |
| `src/supervisor.ts` | `runTask` — the same function, now inside a `for` | rewritten |
| `src/main.ts` | wiring and the three parts | rewritten |
| `src/task-spec.ts` | the contract for the work — comments, plus the formatter moving to `issues.ts` | near enough, from 06 |
| `src/fake-gateway.ts` | the port's second implementation — one line added, to snapshot the transcript | near enough, from 06 |
| `specs/*.json` | two job files: one permits a tool, one permits none | **new** |

The mock server in `01-raw-http/src/mock-server.ts` also grew a tool branch, including the pairing rule: a `tool_result` that answers no `tool_use` in the preceding message is a 400. The change is additive, so a request with no `tools` key takes exactly the path it took before, and exercises 01 to 06 still produce their old numbers.

## Run

Two terminals in `hermes-sdk-lab/07-tool-loop/`:

```powershell
pnpm mock       # terminal 1 — exercise 01's mock server (port 8787)
pnpm job a      # terminal 2 — Part A: one tool call, answered
pnpm job b      # Part B: the loop with a fake, and a tool the job never permitted
pnpm job c      # Part C: a job that permits no tools
```

## What to observe — measured against this mock (SDK 0.113.0, zod 4.4.3)

Numbers below come from a **fresh** mock. Restart it before comparing ids: `toolu_mock_NNNN` counts requests, so a mock that has already served this session hands out higher numbers.

| Experiment | Measured result |
|---|---|
| A: what gets declared | `allowedTools: ["graph_health"]` becomes one entry in `tools`. `graph_writeback` is in the catalogue and is never declared, so the model cannot ask for it |
| A: the `input_schema` | `{"type":"object","properties":{"graph":{"type":"string","minLength":1,"description":"…"}},"required":["graph"]}` — built from the same Zod schema that checks the arguments coming back |
| A: the job | `modelCalls: 2`, `toolRuns: ['graph_health → ran']`, `tokensSpent: 217`. Two model calls for one job, and one tool call between them |
| A: the answer | `Audit complete. The tool reported: graph=atlas nodes=1284 orphans=3 stale_edges=2` — the tool's output crossed the wire and came back inside the model's text |
| A: what growth costs | request 1 reports `input_tokens: 23`, request 2 reports **110**. The mock estimates from `messages` alone, so that rise is the transcript being resent. The `tools` array also goes on every request, and a real provider bills it too |
| B: an unpermitted name | the fake asks for `graph_writeback`; `runTool` refuses it, the refusal travels as a `tool_result` with `is_error: true`, and the loop still reaches `landed` |
| B: transcript growth | `turns sent per model call: [ 1, 3 ]` — call 1 sends `operator`, call 2 sends `operator → model → tools` |
| C: no permitted tools | `declared: 0 tool(s)`, `modelCalls: 1`, `tokensSpent: 65` — the same single call, and the same 65 tokens, as exercise 06 |

## The exercise

1. Run Part A with the mock's terminal visible. Read the two log lines: the first reply asked, the second answered.
2. In `specs/audit-atlas.json`, add `"graph_writeback"` to `allowedTools` and run Part A again. The mock asks for the first declared tool, so watch which one that becomes.
3. Set `allowedTools` to `["graph_delete"]` — a name no implementation backs. Part A prints `allowedTools` and `declared` on two lines; predict both before you run it.
4. Run Part C, and say what its 65 tokens have in common with exercise 06.
5. In `tools.ts`, add a third tool to the catalogue: one Zod schema, one description, one body. Permit it in the spec and run Part A.
6. In `supervisor.ts`, comment out the line that pushes the model's turn into the transcript. Read the 400 that comes back, and say which check caught it.

## Notes

- **The model never runs anything.** A `tool_use` block is a request. Hermes chooses whether to honor it, runs the code, and sends the result back. The provider executes nothing.
- **`tool_use_id` is the pairing key.** The `tool_result` block must carry the id from the `tool_use` block it answers. The mock enforces it, which is what makes exercise step 6 fail visibly rather than silently.
- **A tool result is not a role.** It travels inside a `user` message. `anthropic-gateway.ts` is the only file whose code knows that; the domain says `from: "tools"`.
- **The transcript is Hermes's, not the provider's.** The API keeps no memory between requests, so every model call resends everything.
- **Offering a short tool list is not enforcement.** The reply is model output, so `runTool` checks the name against `allowedTools` again before dispatching. Lesson 0010 adds the operator's approval gate on top.
- **Tool arguments get the boundary treatment.** They arrive as model output, so each tool parses them with its own Zod schema before its body runs. `defineTool` puts the parse inside the tool, which is why the body reads `input.graph` rather than coercing an unknown.
- **`MAX_MODEL_CALLS` is a literal, and a placeholder.** It exists so the loop terminates at all. Lesson 0009 replaces it with the spec's budget, a deadline, and an `AbortController`.
- **The mock approximates.** It cannot reason, so it always asks for the first declared tool and invents arguments from that tool's own JSON Schema. The block shapes are faithful to the API. The choice of tool is a stand-in.
- Everything stays mock-first: no live API calls, no credentials.
- Ops reminder: a `pnpm mock` left running from a previous session serves **old** code and holds port 8787.
