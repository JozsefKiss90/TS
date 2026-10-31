# Lesson 0002 — Run the Raw Request, Against a Mock

> **Record type:** reconstructed study notes from the committed lesson, not a learner's submitted recall or a graded evaluation.
> **Source:** [Lesson 0002](../lessons/0002-raw-http-against-a-mock.html) · **Lab context:** `01-raw-http`.
> **Recall status:** not assessed. No personal answers or performance claims are inferred.

## Mechanism and implementation evidence

The client sends lesson 0001's raw request to a local test double on `localhost:8787`. Its gates check, in order, `x-api-key` (401), `anthropic-version` and `content-type` (400), a rate-limit scenario header (429 with `retry-after: 5`), and the body fields (400 naming the field). A valid request waits about 400 ms, the abort window, then returns a canned Message. Every failure is an HTTP status plus a JSON error envelope. `ANTHROPIC_BASE_URL` makes the destination configuration. The lockfile records `^5.7.0` resolved to 5.9.3.

## Important distinction

A test double enforces shape, never the truths behind it: any key value passes. The body is untyped, so `pnpm typecheck` catches almost none of the six breaks; the server is its first check.

## Recall prompts — unanswered

What can the mock check, and what can it never verify? Which break produces which status, and what is the ~400 ms delay for? Which mistakes did the SDK catch at compile time that this raw client found only at runtime?

## Verification boundary

The implementation results and measurements described above are claims documented in the lesson; they were **not independently rerun** while preparing this record. To promote glossary terms or mark comprehension as demonstrated, complete the lesson exercise, answer the recall prompts without notes, and append a dated evaluation with observed evidence. Existing learning assessments must not be inferred from lesson text.
