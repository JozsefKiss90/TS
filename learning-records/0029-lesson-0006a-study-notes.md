# Supplement 0006a — What Counts as Policy

> **Record type:** reconstructed study notes from the committed lesson, not a learner's submitted recall or a graded evaluation.
> **Source:** [Supplement 0006a](../lessons/0006a-hermes-architecture-primer.html) · **Lab context:** `05-model-gateway` (read only; no `lab:` field, no code shipped).
> **Recall status:** not assessed. No personal answers or performance claims are inferred.

## Mechanism and implementation evidence

A Hermes policy is a deterministic rule that turns checked facts into a permitted action or a final outcome. Five other kinds of work only look like policy: the port (`gateway.ts`), wiring (`main.ts`, the composition root), adaptation (`retry-after: 5` becomes `retryAfterMs: 5000`), SDK mechanics and the wire protocol. Exercise 05 holds two policies, both in `supervisor.ts`: a throttled call waits and runs later, and a bad reply stops the job at zero tokens. The policy ran in 0.6 ms with the mock stopped.

## Important distinction

`const MODEL` in `main.ts` reserves the model choice above the port; no routing rule exists. "Above" and "below" describe imports and duties, not folders or the call stack. An SDK retry re-sends a request; `retry_later` parks the job.

## Recall prompts — unanswered

Define a Hermes policy, with one line that meets it and one that does not. What does "policy above the port" claim, and not claim? Why does the `MODEL` constant not make exercise 05 a router?

## Verification boundary

The implementation results and measurements described above are claims documented in the lesson; they were **not independently rerun** while preparing this record. To promote glossary terms or mark comprehension as demonstrated, complete the lesson exercise, answer the recall prompts without notes, and append a dated evaluation with observed evidence. Existing learning assessments must not be inferred from lesson text.
