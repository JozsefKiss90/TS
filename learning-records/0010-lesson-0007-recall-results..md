The admission boundary guards operator → Hermes: parsed JSON from a job file arrives as unknown and is checked against TaskSpecSchema. The adapter boundary guards provider → Hermes: the provider’s parsed reply arrives and is checked against WireReplySchema before Hermes interprets it.
The rule maxTokens <= costCeilingTokens determines whether the proposed job is internally valid, so it belongs in the schema and must be checked before dispatch. runTask should later enforce the ceiling against cumulative token usage during execution, but it should receive only an already consistent TaskSpec.
admitTaskSpec takes unknown because operator JSON has no runtime proof that it matches even TaskSpecInput. Accepting TaskSpecInput would imply that the value had already been type-checked, whereas unknown forces the function to validate and narrow it before producing a trusted TaskSpec.
---

## Evaluation (2026-08-15, alongside lesson 0009)

All three answers are correct at mechanism level, with no notes or prompting.

1. **Two boundaries, two schemas** — correctly names the admission boundary (operator → Hermes, `unknown` → `TaskSpecSchema`) and the adapter boundary (provider → Hermes, `WireReplySchema`), and that both check before Hermes interprets. Demonstrates [[admissibility-check]].
2. **Refinement placement** — correctly splits internal validity (schema, before dispatch) from runtime enforcement (cumulative usage in `runTask`). This answer *predicted lesson 0009*: the ceiling enforcement it says "runTask should later" do is what 0009 implemented. Demonstrates [[schema-refinement]] and [[task-spec]].
3. **Why `unknown`** — correctly states that accepting `TaskSpecInput` would claim proof that does not exist, and that `unknown` forces the validate-and-narrow. Demonstrates the gate's design rationale.

**Promoted to `demonstrated` (3):** [[task-spec]], [[admissibility-check]], [[schema-refinement]].
