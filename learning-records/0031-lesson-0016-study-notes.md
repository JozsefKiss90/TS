# Lesson 0016 — Evidence Enters the Loop

> **Record type:** reconstructed study notes from the committed lesson, not a learner's submitted recall or a graded evaluation.
> **Source:** [Lesson 0016](../lessons/0016-evidence-enters-the-loop.html) · **Lab context:** `11-evidence-in-the-loop`.
> **Recall status:** not assessed. No personal answers or performance claims are inferred.

## Mechanism and implementation evidence

A fourth port, `EvidencePort.search(query, limit)`, is answered over MCP by `search_evidence`. One bundle per spec query merges into a Context Pack. `admitContextPack(raw: unknown)` returns the pack or reasons. Four rules decide admissibility: at least one item, one snapshot, each id once, and lesson 0014's evidence schema per item. The supervisor also checks that the pack answers the spec's queries; failure ends the job at 0 model calls. Measured over 2 calls: grounded 494 tokens (input 162, 248), bare 236 (33, 119), so 129 per call.

## Important distinction

The pack enters the first user message, not a tool result. The transcript is resent, so every call pays for it again. The `evidence_used` event keeps queries, snapshot and ids, never claim text. The 129 is the mock's one-token-per-four-characters estimate.

## Recall prompts — unanswered

Where does the pack enter, and why is it not a tool result? Name the four admissibility rules. What does the trace keep about evidence, and how are the claims read back?

## Verification boundary

The implementation results and measurements described above are claims documented in the lesson; they were **not independently rerun** while preparing this record. To promote glossary terms or mark comprehension as demonstrated, complete the lesson exercise, answer the recall prompts without notes, and append a dated evaluation with observed evidence. Existing learning assessments must not be inferred from lesson text.
