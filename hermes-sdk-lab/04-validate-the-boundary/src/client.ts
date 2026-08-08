/**
 * Exercise 04 — the boundary, validated.
 *
 * Lesson: ../../../lessons/0005-validate-the-boundary.html
 * Start the mock in another terminal first (`pnpm mock`), then run this
 * with `pnpm request`.
 *
 * Three parts, in order:
 *   A. The assertion — exercise 01's pipeline meets a drifted wire. GIVEN:
 *      run it first and watch the ledger corrupt without a single error.
 *   B. The parse     — write the Zod schema; the same bytes are now REJECTED
 *      at the boundary, with a path to every disagreement.
 *   C. The inversion — clean wire, checked parse, and `z.infer` retires the
 *      hand-written interface: the schema becomes the single source of truth.
 *
 * The mock's `x-mock-scenario: drift` header makes it answer 200 with a body
 * whose shape has quietly changed. Watch the mock's terminal: it TELLS you
 * when it lies. Your job is a client that notices without being told.
 */
import { z } from "zod";

const BASE_URL = process.env["ANTHROPIC_BASE_URL"] ?? "http://localhost:8787";
const API_KEY = process.env["ANTHROPIC_API_KEY"] ?? "mock-key-any-value-passes";

// Exercise 01's hand-written claim, verbatim. After Part C it survives only
// as Part A's museum piece — the "before" of the before/after.
interface MessageResponse {
  id: string;
  type: "message";
  role: "assistant";
  model: string;
  content: Array<{ type: "text"; text: string }>;
  stop_reason: string;
  stop_sequence: string | null;
  usage: { input_tokens: number; output_tokens: number };
}

// You wrote this shape of check by hand for the mock's gate ④ (exercise 01) —
// three lines of runtime narrowing. Zod is this, industrialized.
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Exercise 01's fetch, factored out. Note the HONEST return type: what comes
 * back from JSON.parse is `unknown` until something proves otherwise.
 */
async function fetchMessageBody(scenario?: string): Promise<unknown> {
  const res = await fetch(`${BASE_URL}/v1/messages`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": API_KEY,
      "anthropic-version": "2023-06-01",
      ...(scenario ? { "x-mock-scenario": scenario } : {}),
    },
    body: JSON.stringify({
      model: "claude-opus-4-8",
      max_tokens: 100,
      messages: [{ role: "user", content: "Hello, Claude!" }],
    }),
  });
  if (!res.ok) {
    throw new Error(`Request failed with status ${res.status}`);
  }
  return res.json() as Promise<unknown>;
}

/** GIVEN — run this before writing anything. Every line typechecks. */
async function partA_theAssertion(): Promise<void> {
  console.log("\n=== A. The assertion — exercise 01's pipeline, drifted wire ===");

  // The `as` is exercise 01's move, unchanged: a claim, not a check.
  const data = (await fetchMessageBody("drift")) as MessageResponse;

  console.log("stop_reason:", data.stop_reason);
  console.log("output_tokens:", data.usage.output_tokens);
  console.log("typeof output_tokens (TS says number):", typeof data.usage.output_tokens);

  // A budget ledger, the way Phase 1 will keep one. Watch it closely.
  const spent = data.usage.input_tokens + data.usage.output_tokens;
  console.log("ledger — tokens spent this run:", spent);
  console.log("typeof spent (TS says number):", typeof spent);
  console.log("over the 1000-token ceiling?", spent > 1000);
  // Before moving on, answer: how many tokens were ACTUALLY spent? Where did
  // the number the ledger printed come from? And which line threw? (None.)
}

// One sub-schema given as the worked pattern. Note what it is: a VALUE, built
// at runtime by calling functions — it survives compilation, unlike the
// interface above. `.int().nonnegative()` narrows further than TS's `number`
// ever could: the schema can carry MORE contract than the type did.
const UsageSchema = z.object({
  input_tokens: z.number().int().nonnegative(),
  output_tokens: z.number().int().nonnegative(),
});

const MessageSchema = z.object({
  id: z.string(),
  type: z.literal("message"),
  role: z.literal("assistant"),
  model: z.string(),
  content: z
    .array(
      z.object({
        type: z.literal("text"),
        text: z.string(),
      }),
    )
    .min(1),
  stop_reason: z.enum(["end_turn", "max_tokens", "stop_sequence", "tool_use"]).nullable(),
  usage: UsageSchema,
});

// The runtime contract is the source of truth; its compile-time view is derived.
type Message = z.infer<typeof MessageSchema>;

async function partB_theParse(): Promise<void> {
  console.log("\n=== B. The parse — same drifted wire, checked at the boundary ===");

  const body = await fetchMessageBody("drift");

  const result = MessageSchema.safeParse(body);
  if (result.success) {
    console.error("Validation unexpectedly succeeded:", result.data);
    return;
  }

  console.log("Validation failed with issues:", result.error.issues.length);
  for (const issue of result.error.issues) {
    console.log(
      `Path: ${issue.path.join(".")}, Code: ${issue.code}, Message: ${issue.message}`,
    );
  }
  console.log("Prettified error:\n" + z.prettifyError(result.error));
}

async function partC_theInversion(): Promise<void> {
  console.log("\n=== C. The inversion — clean wire, no assertion anywhere ===");

  const body = await fetchMessageBody(); // no scenario header — honest wire

  const result = MessageSchema.safeParse(body);
  if (!result.success) {
    console.error("Validation failed unexpectedly:", result.error);
    return;
  }

  const data: Message = result.data;

  // Recompute Part A's ledger
  const spent = data.usage.input_tokens + data.usage.output_tokens;
  console.log("ledger — tokens spent this run:", spent);
  console.log("typeof spent (TS says number):", typeof spent);
  console.log("over the 1000-token ceiling?", spent > 1000);

  // Compare the untrusted wire object with the validated, declared subset.
  if (isRecord(body)) {
    console.log("wire keys:", Object.keys(body));
    const wireUsage = body["usage"];
    if (isRecord(wireUsage)) {
      console.log("wire usage keys:", Object.keys(wireUsage));
    }
  }
  console.log("validated keys:", Object.keys(data));
  console.log("validated usage keys:", Object.keys(data.usage));
}

async function main(): Promise<void> {
  await partA_theAssertion();
  await partB_theParse();
  await partC_theInversion();
}

main().catch((err: unknown) => {
  console.error("request failed:", err);
  process.exitCode = 1;
});
