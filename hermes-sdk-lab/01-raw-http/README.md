# 01-raw-http — run the raw request against a mock

The companion lesson is [`lessons/0002-raw-http-against-a-mock.html`](../../lessons/0002-raw-http-against-a-mock.html) — read it first; this file is just the command reference.

## One-time setup

pnpm, once per machine — pick one:

- **corepack** (ships with Node, pins the version in `package.json`; needs an **admin** terminal once because Node lives in `C:\Program Files`):
  ```powershell
  corepack enable            # admin terminal, once
  corepack use pnpm@latest-10   # run inside hermes-sdk-lab/ — installs pnpm and writes the packageManager field
  ```
- **npm** (no admin needed):
  ```powershell
  npm install -g pnpm
  ```

Then install the lab's toolchain from the **lab root** (`hermes-sdk-lab/`):

```powershell
pnpm install
```

Look at what appeared: `pnpm-lock.yaml` (the lockfile) and `node_modules/`.

## Run

Two terminals, both in `hermes-sdk-lab/01-raw-http/`:

```powershell
pnpm mock       # terminal 1 — the mock Messages API on http://localhost:8787
pnpm request    # terminal 2 — your client (src/client.ts)
```

Write the request in `src/client.ts` (the TODOs are the checklist). When it works you should see a 200 with `stop_reason`, the text block, and `usage`.

## Break it — the point of the exercise

Each break: change `client.ts`, run `pnpm request`, and watch **both** terminals.

| Break | Expected result |
|---|---|
| Remove the `x-api-key` header | `401 authentication_error` (②) |
| Remove the `anthropic-version` header | `400 invalid_request_error` (③) |
| Remove `max_tokens` from the body | `400 invalid_request_error` (④) |
| Misspell `messages` in the body | `400` — nothing caught it before the server (④) |
| Add header `x-mock-scenario: rate-limit` | `429 rate_limit_error` + `retry-after` (⑤) |
| `setTimeout(() => controller.abort(), 100)` | `AbortError` in the client, aborted log in the server (⑥) |

Then run `pnpm typecheck` and notice how little of the above TypeScript could have caught — that gap is what exercise `02-model-client-sdk` is about.

## Notes

- The mock validates presence/shape only. A fake key or a misspelled model id sails through — only the real API can catch those.
- Error and response **shapes** match the real Messages API; the message **wording** is approximated.
- Exercise 02 points the official SDK at this same server via `ANTHROPIC_BASE_URL` / the `baseURL` client option. Leave the mock as-is.
