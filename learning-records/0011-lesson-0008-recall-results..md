The transcript lives in Hermes because the Messages API does not retain the previous exchange: every model call is independent, so Hermes must resend the complete conversation. Keeping it in Hermes also lets the supervisor own tool-result pairing, budgets, termination and provider-neutral conversation state; the adapter merely translates each transcript snapshot into provider messages.
Not declaring a tool limits what a compliant model is shown, but it does not prove that an untrusted provider reply will only name declared tools. runTool must therefore enforce allowedTools again before execution, because declaration controls visibility while the name check controls authority.
The three boundaries are:
Boundary	What arrives	What parses it
Operator → Hermes	Job-file data, including allowedTools	JSON.parse() produces unknown, then TaskSpecSchema.safeParse() admits or refuses it
Provider → Hermes	Reply containing text or tool_use blocks	The adapter’s WireReplySchema.safeParse()
Tool call → tool implementation	Model-generated ToolCall.input arguments	That tool’s own Zod inputSchema.safeParse() inside runTool/defineTool
---

## Evaluation (2026-08-15, alongside lesson 0009)

All three answers are correct at mechanism level, with no notes or prompting.

1. **Transcript ownership** — statelessness stated as the cause, plus the supervisory reasons (pairing, budgets, termination, provider-neutral state) and the adapter's translate-only role. Demonstrates [[tool-loop]].
2. **Why `runTool` re-checks** — the visibility-versus-authority split ("declaration controls visibility while the name check controls authority") is a sharper statement than the lesson's own. Demonstrates the enforcement half of the loop.
3. **Three boundaries, three parsers** — operator file → `TaskSpecSchema`, provider reply → `WireReplySchema`, tool arguments → each tool's own schema inside `runTool`/`defineTool`. Complete and correctly attributed. Demonstrates [[tool-use-block]] and [[tool-result-block]] handling.

**Promoted to `demonstrated` (3):** [[tool-use-block]], [[tool-result-block]], [[tool-loop]].
