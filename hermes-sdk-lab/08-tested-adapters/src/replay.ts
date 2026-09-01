/**
 * The REPLAY seam — recorded wire exchanges, served without a network.
 *
 * The Anthropic client accepts a `fetch` option: every request the SDK
 * would put on a socket goes through that function instead. Everything
 * above it — auth headers, retries, SSE parsing, the adapter's boundary
 * parse — runs unchanged. Everything below it — DNS, TCP, a listening
 * process — does not exist. That is what "offline" means here: not a mock
 * on localhost, but no socket at all.
 *
 * A fixture file is bytes on disk, like a spec file (lesson 0007) and a
 * trace file (lesson 0011). Bytes are untrusted even when a script in this
 * repo wrote them, so loading a fixture is a parse, not a cast.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { formatIssues } from "../../07-tool-loop/src/issues.js";

/**
 * One recorded exchange: the request the adapter sent when the fixture was
 * recorded, and the response the mock returned. Headers keep only the
 * fields the tests read — a full capture would freeze incidental noise
 * (dates, lengths, telemetry) into every byte comparison.
 */
export const RecordedExchangeSchema = z.object({
  scenario: z.string().min(1),
  recordedAt: z.string().min(1),
  request: z.object({
    method: z.string().min(1),
    path: z.string().min(1),
    headers: z.record(z.string(), z.string()),
    body: z.string(),
  }),
  response: z.object({
    status: z.number().int().positive(),
    headers: z.record(z.string(), z.string()),
    body: z.string(),
  }),
});

export type RecordedExchange = z.infer<typeof RecordedExchangeSchema>;

const FIXTURE_DIR = new URL("../fixtures/", import.meta.url);

/** Load one fixture by name. Refuses bytes that do not match the schema. */
export function loadExchange(name: string): RecordedExchange {
  const text = readFileSync(fileURLToPath(new URL(`${name}.json`, FIXTURE_DIR)), "utf8");
  const parsed = RecordedExchangeSchema.safeParse(JSON.parse(text));
  if (!parsed.success) {
    throw new Error(`fixture ${name}: ${formatIssues(parsed.error).join("; ")}`);
  }
  return parsed.data;
}

/** What one replayed call captured: the request the SDK actually made. */
export interface SentRequest {
  path: string;
  headers: Record<string, string>;
  body: string;
}

/** The request headers worth keeping. The SDK sends more (telemetry,
 * lengths); the tests compare only the fields the wire contract names.
 * Exported so the recorder keeps the SAME subset: if the two lists
 * drifted apart, the byte comparisons would quietly weaken. */
export const KEPT_REQUEST_HEADERS = [
  "content-type",
  "anthropic-version",
  "x-api-key",
  "x-mock-scenario",
];

export function captureHeaders(headers: Headers, keep: readonly string[]): Record<string, string> {
  const kept: Record<string, string> = {};
  for (const name of keep) {
    const value = headers.get(name);
    if (value !== null) kept[name] = value;
  }
  return kept;
}

/** One captured request, as both the replayer and the recorder keep it. */
export function captureSentRequest(
  url: string | URL | Request,
  init?: RequestInit,
): SentRequest {
  const target = url instanceof Request ? url.url : url.toString();
  return {
    path: new URL(target).pathname,
    headers: captureHeaders(new Headers(init?.headers), KEPT_REQUEST_HEADERS),
    body: typeof init?.body === "string" ? init.body : "",
  };
}

/**
 * A fetch function that answers from a script, like the fake gateway does —
 * one level lower. It serves each recorded response in order and captures
 * each request the SDK sends, so a test can compare today's bytes against
 * the recorded ones.
 */
export function replayFetch(exchanges: RecordedExchange[]): {
  fetch: (url: string | URL | Request, init?: RequestInit) => Promise<Response>;
  sent: SentRequest[];
} {
  const script = [...exchanges];
  const sent: SentRequest[] = [];

  return {
    sent,
    fetch: (url, init) => {
      const next = script.shift();
      if (next === undefined) {
        return Promise.reject(new Error("replay script exhausted"));
      }

      sent.push(captureSentRequest(url, init));

      return Promise.resolve(
        new Response(next.response.body, {
          status: next.response.status,
          headers: next.response.headers,
        }),
      );
    },
  };
}
