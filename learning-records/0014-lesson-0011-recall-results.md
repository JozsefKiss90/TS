The trace must be appended event by event because the process may crash or be aborted before reaching job_ended. If tracing waited until the end, the failure would destroy both the in-memory execution state and the unwritten history—the trace would have the same weakness as the final JobReport.

That breaks the separation between policy and history:

TaskSpec, the gate and the operator determine what may happen.
The trace records what did happen.

Consulting an editable historical record for permission would turn evidence into authority. Previous approval—or a modified trace line—could incorrectly authorize a new tool call.

Run 1’s trace retained the completed earlier events, the fact that the interrupted call started, its cumulative token estimate, the classified ending, and the generated partialArtifact. Run 2 keeps that partial text only as diagnostic evidence: rebuildResumePoint() does not insert it as a completed model turn, so the new call continues from the last coherent completed transcript boundary.

Nobody holds a suspended generation or provider conversation: the old stream, promise and model computation are gone. Run 2 makes a completely new provider request using the transcript reconstructed and owned by Hermes.

---

## Evaluation (appended 2026-09-01, alongside lesson 0012)

All three answers are correct at mechanism level, with no prompting and no notes.

1. **Correct.** Names the failure mode exactly: a crash before `job_ended` would destroy the in-memory state *and* the unwritten history together, so an end-of-run trace would inherit the `JobReport`'s weakness. That is the lesson's core argument, restated rather than recited.
2. **Correct, and sharper than the lesson.** The separation is named (policy vs. history: the spec, gate and operator decide what *may* happen; the trace records what *did*), and the answer adds the reason the direction of the arrow matters: consulting an editable historical record for permission "turns evidence into authority" — a tampered or stale line could authorize a new call. The lesson's own phrasing ("editing one cannot approve a tool") is derived, not quoted.
3. **Correct on all three parts.** What run 1's trace kept (completed events, the interrupted `call_started`, the estimated spend, the classified ending, the partial text); what run 2 does with the partial artifact (diagnostic evidence only — `rebuildResumePoint` does not insert it as a completed model turn, so the resume continues from the last coherent transcript boundary); and what nobody holds (the suspended generation — stream, promise and computation are gone, and run 2 is a fresh provider request from a Hermes-owned transcript). The one wording drift (`partialArtifact` for the event field `partialText`) is naming, not mechanism.

**Promotions:** [[trace]] → `demonstrated` (all three answers use the record correctly: append-at-the-moment, record-not-policy, rebuild-from-file). [[partial-artifact]] → `demonstrated` (answer 3 was its designed workout, per the 2026-08-25 note, and passes it: kept as evidence, never resent as a turn, remainder never generated). [[json-lines]] stays `introduced` — no answer touches the format itself; its workout is lesson 0012's fixture files. [[default-deny]] stays `introduced` — still no answer states the rule; next natural workout is lesson 0012's say-it.