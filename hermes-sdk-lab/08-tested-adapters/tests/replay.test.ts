/**
 * The replay seam itself, tested with an inline exchange — no fixture file,
 * no SDK. If these fail, every fixture-backed test below them is suspect,
 * so they run first alphabetically-adjacent and depend on nothing.
 */
import { describe, expect, it } from "vitest";
import { RecordedExchangeSchema, replayFetch } from "../src/replay.js";

const exchange = RecordedExchangeSchema.parse({
  scenario: "inline",
  recordedAt: "2026-09-01",
  request: {
    method: "POST",
    path: "/v1/messages",
    headers: { "content-type": "application/json" },
    body: '{"model":"m","max_tokens":1,"messages":[]}',
  },
  response: {
    status: 200,
    headers: { "content-type": "application/json", "request-id": "req_mock_0001" },
    body: '{"ok":true}',
  },
});

describe("replayFetch", () => {
  it("serves the recorded response: status, headers and body", async () => {
    const { fetch } = replayFetch([exchange]);
    const response = await fetch("http://never.invalid/v1/messages", { method: "POST" });

    expect(response.status).toBe(200);
    expect(response.headers.get("request-id")).toBe("req_mock_0001");
    expect(await response.text()).toBe('{"ok":true}');
  });

  it("captures what the caller actually sent, for later comparison", async () => {
    const { fetch, sent } = replayFetch([exchange]);
    await fetch("http://never.invalid/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": "recorded" },
      body: '{"model":"m"}',
    });

    expect(sent).toHaveLength(1);
    expect(sent[0]?.path).toBe("/v1/messages");
    expect(sent[0]?.headers["x-api-key"]).toBe("recorded");
    expect(sent[0]?.body).toBe('{"model":"m"}');
  });

  it("throws when the script is exhausted, like the fake gateway does", async () => {
    const { fetch } = replayFetch([exchange]);
    await fetch("http://never.invalid/v1/messages", { method: "POST" });

    await expect(fetch("http://never.invalid/v1/messages", { method: "POST" })).rejects.toThrow(
      "replay script exhausted",
    );
  });
});
