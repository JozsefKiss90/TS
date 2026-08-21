1. The true `output_tokens` count arrives only in the final `message_delta`; while generation is running, Hermes has only the true input count and the number of text characters received. Therefore, it estimates output tokens from characters, and the estimate must err high so that Hermes stops slightly early rather than allowing a budget breach.

2. Checking only between calls cannot stop a single expensive generation after it has started. The supervisor would learn about the overspend only after the provider had completed and charged for the entire response.

3. The spec declares:

| Bound               | Meaning                                 | Outcome when fired |
| ------------------- | --------------------------------------- | ------------------ |
| `maxModelCalls`     | Maximum model calls allowed in the loop | `gave_up`          |
| `costCeilingTokens` | Maximum permitted token expenditure     | `over_budget`      |
| `deadlineMs`        | Maximum elapsed job time                | `out_of_time`      |

---

## Evaluation (appended 2026-08-20, alongside lesson 0010)

All three answers are correct at mechanism level, with no prompting and no notes.

1. **Correct, complete.** Both halves are there: *why* an estimate (true `output_tokens` arrive only in the final `message_delta`) and *which way it errs* (high, so the stop lands early rather than after a breach). This is the same reasoning the user first derived unprompted after lesson 0004 (see NOTES 2026-07-27) — now stated as a working rule, not a prediction.
2. **Correct.** Names the exact loss: a between-calls-only check cannot stop one expensive generation, and the overspend is only learned after the provider has completed and billed it. This is lesson 0009 §2's core claim, reproduced from memory.
3. **Correct.** All three spec bounds with their exact outcome arms, including the non-obvious pairing of the call cap with `gave_up` (not a dedicated outcome).

**Promotions:** [[termination]] → `demonstrated` (answer 3 is the term's definition exercised: every bound produces a classified exit). [[partial-artifact]] stays `introduced` — none of the three answers touches what an aborted generation keeps; its cleanest workout is lesson 0011's landing/trace work or a say-it there.
