/**
 * RECORDED FIXTURES for the evidence surface (lesson 0015).
 *
 * A fixture holds one call the way the client saw it: the request it sent
 * and the bundle that came back as `structuredContent`. The recorder
 * (`record-fixtures.ts`) writes them by running the real adapter under a
 * real client, in one process, over an in-memory transport. Nothing in a
 * fixture file is typed by hand.
 *
 * Reading one back is a parse (lesson 0012). The schema below nests
 * `EvidenceBundleSchema`, so the two-sources refinement runs on every
 * fixture at load, and a tampered file is refused before a test replays it.
 */
import { readFileSync } from "node:fs";
import { z } from "zod";
import { EvidenceBundleSchema } from "./evidence.js";
import type { ParseOutcome } from "./export-adapter.js";

export const RecordedCallSchema = z.object({
  recordedAt: z.iso.datetime(),
  request: z.object({
    name: z.literal("search_evidence"),
    arguments: z.object({
      query: z.string().min(1),
      limit: z.number().int().min(1).max(20).optional(),
    }),
  }),
  result: EvidenceBundleSchema,
});

export type RecordedCall = z.infer<typeof RecordedCallSchema>;

export function parseFixture(raw: unknown): ParseOutcome<RecordedCall> {
  const result = RecordedCallSchema.safeParse(raw);
  return result.success
    ? { ok: true, value: result.data }
    : { ok: false, issues: z.prettifyError(result.error) };
}

/** Read and parse one fixture. Throws, because a bad fixture is a test-setup fault. */
export function loadFixture(path: URL | string): RecordedCall {
  const raw: unknown = JSON.parse(readFileSync(path, "utf8"));
  const parsed = parseFixture(raw);
  if (!parsed.ok) throw new Error(`fixture rejected (${String(path)}):\n${parsed.issues}`);
  return parsed.value;
}
