# 02-model-client-sdk — the same request, through `@anthropic-ai/sdk`

The companion lesson is [`lessons/0003-the-sdk-absorbs-the-six.html`](../../lessons/0003-the-sdk-absorbs-the-six.html) — read it first; this file is just the command reference.

## Setup

Nothing new — the workspace install covers this exercise too. If you haven't installed since exercise 01 gained a sibling, run from the **lab root** (`hermes-sdk-lab/`):

```powershell
pnpm install
```

Then open `pnpm-lock.yaml` and find `@anthropic-ai/sdk`: one new direct dependency, and every transitive dependency it dragged in, pinned.

## Run

Two terminals, both in `hermes-sdk-lab/02-model-client-sdk/`:

```powershell
pnpm mock       # terminal 1 — exercise 01's mock server, unchanged
pnpm request    # terminal 2 — your SDK client (src/client.ts)
```

(`pnpm mock` here just runs `../01-raw-http/src/mock-server.ts` — same server, same port 8787. The mock does not know or care which client is calling: that is the point of the base-URL seam.)

Write the request in `src/client.ts` (the TODOs are the checklist). Success looks like exercise 01's output: a `request-id`, `stop_reason`, the text block, and `usage` — diff the two.

## Break it — the point of the exercise

Each experiment: change `client.ts`, run `pnpm typecheck` and/or `pnpm request`, and watch **both** terminals.

| Experiment | Expected result |
|---|---|
| Misspell `messages` as `mesages` | **Compile** error: "'mesages' does not exist … Did you mean to write 'messages'?" — the mock never runs (④) |
| Delete `max_tokens` | **Compile** error: "Property 'max_tokens' is missing" — exercise 01's runtime 400, moved left (④) |
| Set `apiKey: "definitely-not-real"` | 200 — the mock checks presence, not truth; only the real API rejects values (②) |
| Misspell the model id (`claude-opsu-4-8`) | Compiles **and** returns 200 — `Model` ends in `\| (string & {})`, and the mock echoes any model; only the real API 404s (④) |
| Options bag `{ headers: { "x-mock-scenario": "rate-limit" }, maxRetries: 0 }` | Immediate `RateLimitError` — inspect `.status`, `.type`, `.requestID`, `.headers.get("retry-after")` (⑤) |
| Same header, default `maxRetries` | ~10 s of silence, **3** requests in the mock's log, then `RateLimitError` — the SDK honored `retry-after: 5` twice (⑤) |
| Options bag `{ timeout: 200 }` (mock latency is ~400 ms) | `APIConnectionTimeoutError` after ~2 s and **3** aborted requests in the mock's log — timeouts are retried too (⑤⑥) |
| `controller.abort()` after 100 ms via `{ signal }` | `APIUserAbortError`, **1** aborted request — user aborts are never retried (⑥) |
| `apiKey: null, authToken: null` on the client | Error **before any request exists**: "Could not resolve authentication method…" — the 401 moved client-side (②) |

Then ask of each row: which layer caught it — the compiler, the SDK, the mock — and what would only the real API have caught?

## Notes

- The wire contract did not change. Watch the mock's terminal during a success: same `POST /v1/messages`, same gates ②③④, same canned fixture. An SDK does an API's chores; it does not change the API.
- The SDK's response types (`Message`, `ContentBlock`) are still compile-time claims attached to `JSON.parse` output by assertion — lesson 0001 §3 applies to the SDK exactly as it did to your raw client.
- Everything taught here was read from the installed package's `.d.ts` files (`node_modules/@anthropic-ai/sdk/client.d.ts`, `core/error.d.ts`, `resources/messages/messages.d.ts`) — they are the SDK's real, generated contract. Get in the habit of reading them.
