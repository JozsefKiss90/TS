# 07-tool-loop — one call becomes a loop, bounded, gated and traced

Four lessons share this exercise. Lesson 0008, [`0008-tool-use-the-loops-heartbeat.html`](../../lessons/0008-tool-use-the-loops-heartbeat.html), built the loop (Parts A–C). Lesson 0009, [`0009-bounds-and-termination.html`](../../lessons/0009-bounds-and-termination.html), bounded it (Parts D–F). Lesson 0010, [`0010-approval-gates-and-permissions.html`](../../lessons/0010-approval-gates-and-permissions.html), gated it (Parts G–I). Lesson 0011, [`0011-the-trace-is-what-happened.html`](../../lessons/0011-the-trace-is-what-happened.html), gave every run a durable trace (Parts J–L). Read the lesson first; this file is the command reference and the measured results.

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
| `src/approval.ts` | the gate as one pure function, and the operator's port (lesson 0010) | **new** |
| `src/fake-gateway.ts` | the port's second implementation — one line added, to snapshot the transcript | near enough, from 06 |
| `src/trace.ts` | the event vocabulary as one Zod schema, the trace port, the reader, and the resume rebuild (lesson 0011) | **new** |
| `src/trace-story.ts` | a parsed trace printed back as a story, with +ms deltas (lesson 0011) | **new** |
| `src/read-trace.ts` | the `pnpm trace <file>` CLI — needs the file and nothing else (lesson 0011) | **new** |
| `specs/*.json` | seven job files: two from lesson 0008, one per bound from lesson 0009, two gated jobs from lesson 0010 | **new** |

The mock server in `01-raw-http/src/mock-server.ts` also grew a tool branch, including the pairing rule: a `tool_result` that answers no `tool_use` in the preceding message is a 400. The change is additive, so a request with no `tools` key takes exactly the path it took before, and exercises 01 to 06 still produce their old numbers.

## Run

Two terminals in `hermes-sdk-lab/07-tool-loop/`:

```powershell
pnpm mock       # terminal 1 — exercise 01's mock server (port 8787)
pnpm job a      # terminal 2 — Part A: one tool call, answered
pnpm job b      # Part B: the loop with a fake, and a tool the job never permitted
pnpm job c      # Part C: a job that permits no tools
pnpm job d      # Part D (lesson 0009): the call cap, offline, with a fake
pnpm job e      # Part E (lesson 0009): the budget aborts a generation mid-delta
pnpm job f      # Part F (lesson 0009): the deadline aborts a generation on the clock
pnpm job g      # Part G (lesson 0010): the gate, offline — auto beside denied
pnpm job h      # Part H (lesson 0010): the gate, live — YOU answer in the terminal
pnpm job i      # Part I (lesson 0010): an operator who never answers, offline
pnpm job j      # Part J (lesson 0011): every run leaves a trace — Part A, written down
pnpm job k      # Part K (lesson 0011): diagnose a finished run from its trace alone
pnpm job l      # Part L (lesson 0011): resume an interrupted job from its trace

pnpm trace traces/tight-budget.jsonl   # read any trace back as a story
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

## What lesson 0009 changed, and what it measured

The gateway now **streams every call** (`client.messages.stream` instead of `create`), because a bound that is only checked after a reply lands cannot stop the reply. The mock's streaming path learned the same tool decision its JSON path already made, so Parts A–C produce their old numbers through the new delivery — 217, 95 and 65 tokens, re-measured above. The spec gained `maxModelCalls` (default 4) and `deadlineMs` (default 60000), and `costCeilingTokens` is now enforced rather than merely declared. Every abort keeps the partial text.

| Experiment | Measured result (fresh mock, SDK 0.113.0, zod 4.4.3) |
|---|---|
| D: the call cap | `maxModelCalls: 2` from `capped.json`; the fake was scripted for 3 asking replies and answered **2**; `outcome: 'gave_up'`, 60 tokens |
| E: the budget | ceiling 190; call 1 books 65 (true); call 2's `message_start` reports `input_tokens: 110`; the 80% alert fires at estimated 175; the abort fires after **46 of 82 chars**, `outcome: 'over_budget'`, ledger **191 (estimated)** |
| E: the partial artifact | `Audit complete. The tool reported: graph=atlas` — kept and reported; the remaining 36 chars were never generated |
| F: the deadline | `deadlineMs: 2400`; the job ended at ~**2424 ms**, mid-generation of call 2; `outcome: 'out_of_time'`, 24 chars kept, ledger 183 (estimated) |
| The estimate's error | booked 191 against a ceiling of 190: the pre-request check lets a call start below the ceiling, and the ceiling is crossed during it by at most one estimate step |
| Wire truth | `message_start` carries `"usage":{"input_tokens":110,"output_tokens":1,…}` — input is true from the first frame, output is a placeholder. The true count (`"usage":{"output_tokens":42}`) arrives only in `message_delta`. An aborted call never receives that frame |

## What lesson 0010 changed, and what it measured

The spec gained `approvalRequired` (default empty): the subset of `allowedTools` whose calls must wait for an operator. A second refinement refuses, at admission, any spec that gates a tool it never permitted. `approval.ts` holds the gate — one pure function with three answers (`not_permitted`, `auto`, `hold`) — and the `ApprovalPort` the supervisor asks about a held call. The wait runs against the same `AbortController` as every bound, so a silent operator cannot hang a job. Nothing changed in `gateway.ts`, in the adapter, or in the mock: the wire has no approval field.

| Experiment | Measured result (fresh mock, SDK 0.113.0, zod 4.4.3) |
|---|---|
| G: two decisions, one reply | the fake's first reply carries two calls; `graph_health → ran` with no question asked, `graph_writeback → denied by the operator` (scripted); one `tools` turn carries both results; `outcome: 'landed'`, 136 tokens |
| H, approved | you type `y`: `graph_writeback → ran (approved)`, the answer reads `Audit complete. The tool reported: wrote patch to atlas`, 221 tokens |
| H, denied | you type `n`: the denial crosses the wire as a `tool_result` with `is_error: true` and the operator's sentence as its content; the answer quotes it; 229 tokens |
| H: what the wire shows | the two second-requests are identical except that one `tool_result` block. No request field records the gate, the wait, or who decided |
| The pause is invisible | the human took ~4 s to answer; the API is stateless, so a late request is just a request. Nothing times out and nothing is billed while Hermes waits |
| I: nobody answers | `deadlineMs: 2000`; the approver's promise never resolves; the job ends at ~**2018 ms** with `outcome: 'out_of_time'`, note `deadline of 2000 ms passed while "graph_writeback" waited for approval`; `graph_health` still ran, 42 tokens |

## What lesson 0011 changed, and what it measured

The supervisor's every decision now also lands in a trace, through a third port (`TracePort`), at the moment it happens — not at the end, because a crashed job must still leave its story. The wiring's sink appends one JSON line per event to `traces/<name>.jsonl`, synchronously (this survives the process dying, not a power cut — that would need fsync, which the lab skips). With no trace wired, `record` is a no-op: Parts A–I re-ran as regression and reproduce their numbers (217, 95, 65, gave_up-at-2, 191/190 with 46 chars, ~2405 ms, 136, ~2003 ms). Nothing changed in `gateway.ts`, the adapter, or the mock: the trace never crosses the wire. Its one join key to the provider's own logs is the `request-id` response header, stored per reply.

| Experiment | Measured result (fresh mock, SDK 0.113.0, zod 4.4.3) |
|---|---|
| J: the same job, written down | Part A's job with a trace wired: the report is unchanged (217 tokens, landed) and `traces/audit-atlas.jsonl` holds **8 lines** — `job_started`, `call_started`, `reply`, `gate`, `tool_result`, `call_started`, `reply`, `job_ended` |
| J: the join key | the first response's headers carry `request-id: req_mock_0001`; the trace's first `reply` line stores `"requestId":"req_mock_0001"`. Nothing else in the trace ever crossed the wire |
| K: diagnosis from the file alone | `pnpm trace` on the tight-budget trace answers everything without the process that ran it: call 1 booked 23+42 true tokens, call 2 started at +1709 ms and never got a `reply` line, the job ended `over_budget` at 191/190 with a 46-char partial artifact |
| K: a tampered line | change `"tokensSpent":191` to `"tokensSpent":"191"` and the reader answers `line 7 REFUSED: tokensSpent: [invalid_type] Invalid input: expected number, received string` — the other six lines still read, and the missing `job_ended` is flagged |
| L: run 1, interrupted | `tight-deadline.json`'s 2400 ms deadline fires mid-call-2: `out_of_time`, 183 tokens (estimated), 24-char partial, `job_ended` at ~+2420 ms. The aborted call consumed `req_mock_0002`, which the trace shows only as a `call_started` with no `reply` |
| L: the rebuild | `rebuildResumePoint` from the file alone: transcript `operator → model → tools`, 183 tokens, 2 calls — the process that ran the job is gone |
| L: run 2, resumed | fresh clock, same ledger: call **3** (numbering continues), `req_mock_0003`, `landed`, **335** tokens total for the whole job |

## The exercise

1. Run Part A with the mock's terminal visible. Read the two log lines: the first reply asked, the second answered.
2. In `specs/audit-atlas.json`, add `"graph_writeback"` to `allowedTools` and run Part A again. The mock asks for the first declared tool, so watch which one that becomes.
3. Set `allowedTools` to `["graph_delete"]` — a name no implementation backs. Part A prints `allowedTools` and `declared` on two lines; predict both before you run it.
4. Run Part C, and say what its 65 tokens have in common with exercise 06.
5. In `tools.ts`, add a third tool to the catalogue: one Zod schema, one description, one body. Permit it in the spec and run Part A.
6. In `supervisor.ts`, comment out the line that pushes the model's turn into the transcript. Read the 400 that comes back, and say which check caught it.

Lesson 0009's steps:

7. Run Part D. Set `maxModelCalls` to 1 in `specs/capped.json`, predict the report, then run again.
8. Run Part E with the mock's terminal visible. Match the mock's last delta against the partial artifact in the report.
9. Raise `costCeilingTokens` in `specs/tight-budget.json` to 250. Predict which bound fires now, then run.
10. Lower `deadlineMs` in `specs/tight-deadline.json` to 300. Say where the abort lands before you run: no delta has arrived by then, so the partial is empty.

Lesson 0010's steps:

11. Run Part H twice with the mock's terminal visible: approve once, deny once. Compare `toolRuns`, the final answer, and the mock's request count.
12. In `specs/patch-orphans.json`, move `graph_writeback` out of `approvalRequired`. Predict what Part H asks you now, then run it.
13. Add a tool name to `approvalRequired` that `allowedTools` does not list. Predict which layer refuses, and with which message, then run any part that reads this spec.
14. Run Part I, then raise `deadlineMs` to 60000 and run it again. Say what you are now waiting for, and press Ctrl+C with a clear conscience.

Lesson 0011's steps:

15. Run Part J, then open `traces/audit-atlas.jsonl` in your editor. Match each line to the report, and find the one value in the file that the provider also has.
16. Run Part K, then change `"tokensSpent":191` in the trace file to `"tokensSpent":"191"` and run `pnpm trace traces/tight-budget.jsonl`. Say which lesson taught you the refusal you are reading.
17. Run Part K again for a clean file, delete its last line, and read it back. Say what the missing `job_ended` tells you.
18. Run Part L. Before run 2's report prints, predict the total spend from run 1's report, then check. Then say why the resumed call is numbered 3 and not 1.

## Notes

- **The model never runs anything.** A `tool_use` block is a request. Hermes chooses whether to honor it, runs the code, and sends the result back. The provider executes nothing.
- **`tool_use_id` is the pairing key.** The `tool_result` block must carry the id from the `tool_use` block it answers. The mock enforces it, which is what makes exercise step 6 fail visibly rather than silently.
- **A tool result is not a role.** It travels inside a `user` message. `anthropic-gateway.ts` is the only file whose code knows that; the domain says `from: "tools"`.
- **The transcript is Hermes's, not the provider's.** The API keeps no memory between requests, so every model call resends everything.
- **Offering a short tool list is not enforcement.** The reply is model output, so `runTool` checks the name against `allowedTools` again before dispatching. Since lesson 0010 the approval gate sits in front of that check: a held call reaches `runTool` only once approved.
- **The gate is Hermes-side only.** The API has no approval field. The model sees outcomes — a `tool_result`, or a refusal with `is_error` set — and cannot tell an operator's denial from a tool failure except by reading the content text.
- **Default deny at the port.** A held call with no approval channel is denied, and Part H treats a closed stdin the same way: whatever cannot be decided is refused. The spec side is different on purpose — an empty `approvalRequired` is permissive, so a read-only job can run unattended.
- **Tool arguments get the boundary treatment.** They arrive as model output, so each tool parses them with its own Zod schema before its body runs. `defineTool` puts the parse inside the tool, which is why the body reads `input.graph` rather than coercing an unknown.
- **Every bound comes from the spec now.** Lesson 0008's `MAX_MODEL_CALLS` literal is gone: `maxModelCalls`, `costCeilingTokens` and `deadlineMs` are the operator's, and every exit is a classified outcome.
- **In-flight enforcement acts on an estimate.** A call's `input_tokens` are true from `message_start`; its output is estimated at one token per three characters until `message_delta` delivers the truth. An aborted call never gets that frame, so its spend stays an estimate, and the report says so.
- **The trace records, it never decides.** Deleting a trace changes no future decision, and editing one cannot approve a tool. Policy lives in the spec; the trace only records which policy fired. That separation — what Hermes may do apart from what it did — is a standing course rule.
- **A trace file is a JSON boundary.** Any editor, any program, any crash can have touched it since it was written, so `parseTrace` refuses lines instead of trusting them — the fourth boundary this lab defends, after replies, specs and tool arguments.
- **One file per run, and the line number is the sequence number.** The sink truncates on start, appends one JSON line per event, and never rewrites. A resumed run writes its own file.
- **The mock approximates.** It cannot reason, so it always asks for the first declared tool and invents arguments from that tool's own JSON Schema. Its token counts are estimates and its canned output is 42 tokens. The block shapes and the SSE grammar are faithful to the API. The choice of tool is a stand-in.
- Everything stays mock-first: no live API calls, no credentials.
- Ops reminder: a `pnpm mock` left running from a previous session serves **old** code and holds port 8787.
