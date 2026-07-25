# 03-streaming-and-cancellation — the same Message, delivered as a process

The companion lesson is [`lessons/0004-the-response-becomes-a-process.html`](../../lessons/0004-the-response-becomes-a-process.html) — read it first; this file is just the command reference.

## Setup

Nothing new — the workspace install covers this exercise too. If you haven't installed since the lab gained this exercise, run from the **lab root** (`hermes-sdk-lab/`):

```powershell
pnpm install
```

## Run

Two terminals, both in `hermes-sdk-lab/03-streaming-and-cancellation/`:

```powershell
pnpm mock       # terminal 1 — exercise 01's mock server, now speaking SSE too
pnpm request    # terminal 2 — your streaming client (src/client.ts)
```

(`pnpm mock` runs `../01-raw-http/src/mock-server.ts` — the same server, same port 8787, same gates ②③④. It answers with a stream only when the request body says `"stream": true`; exercises 01 and 02 still get their JSON. Send a non-streaming request from here and check: nothing changed.)

Work through `src/client.ts` top to bottom — parts A, B, C are the checklist. **Watch both terminals every run**: the mock logs every SSE event as it writes it, so you can see each piece leave the server and arrive in your client.

## What to observe — measured against this mock

| Experiment | Expected result |
|---|---|
| A: iterate `create({ ..., stream: true })` | Exactly this order: `message_start`, `content_block_start`, 8× `content_block_delta`, `content_block_stop`, `message_delta`, `message_stop` — ~1.4 s total |
| A: look for the `ping` the mock logs | It never reaches your loop — the SDK filters keep-alives out (`core/streaming.js`: `if (sse.event === 'ping')`) |
| A: where are `stop_reason` and `usage.output_tokens`? | In `message_delta`, at the **end** — `message_start`'s skeleton has `stop_reason: null` and a placeholder `output_tokens: 1` |
| B: `stream.on("text", ...)` + `finalMessage()` | 8 chunks starting ~540 ms in; the assembled `Message` matches exercise 02's response — same text, same `usage`, same `stop_reason` |
| B: print `message._request_id` | `undefined` — the helper assembled this object **client-side from events**; the header's id lives on `stream.request_id` instead |
| C: `controller.abort()` at 700 ms via `{ signal }` | `APIUserAbortError` ~30 ms later; you are left holding `"Hello from the mock. These bytes have the"` — 41 characters, 2 deltas |
| C: the mock's terminal after the abort | 2 deltas logged, then `client aborted the request mid-flight (⑥)` — the other 6 deltas were **never sent** |
| Extra: `stream.currentMessage` inside the abort handler | A partial `Message` snapshot: 2 chunks of text, `stop_reason: null` — the accumulator's state at the moment of death |

Then ask of each row: which of exercise 02's six responsibilities does this change — and which does it leave exactly where it was?

## Notes

- The gates did not move. A missing `x-api-key` or `max_tokens` still fails with the same JSON errors *before* any stream starts — `stream: true` changes the response's **delivery**, not the contract.
- The assembled message and exercise 02's message are the same `Message` shape from the same fixture. Streaming is a transport decision, not a different API.
- Everything taught here was read from the installed package's `.d.ts` files (`resources/messages/messages.d.ts` for the `RawMessageStreamEvent` union and the two `create` overloads, `lib/MessageStream.d.ts` for the helper's events and methods) and then verified live against this mock. Keep that habit.
