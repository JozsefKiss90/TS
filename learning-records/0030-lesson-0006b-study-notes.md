# Supplement 0006b — The Hermes Control Plane

> **Record type:** reconstructed study notes from the committed lesson, not a learner's submitted recall or a graded evaluation.
> **Source:** [Supplement 0006b](../lessons/0006b-the-hermes-control-plane.html) · **Lab context:** none (`lab: —`); the supplement ships no code.
> **Recall status:** not assessed. No personal answers or performance claims are inferred.

## Mechanism and implementation evidence

The supplement maps Hermes OS from the job inward, grading each claim against PDR-001 and ADR-0001..0021. A Hermes job is a governed unit of work: an eight-field Job Envelope (the contract), an admitted Context Pack, state, budget, evidence and a terminal outcome. No envelope or no pack means no dispatch. The control plane has fourteen owned responsibilities, mostly scripts, checks or the operator. The `hermes rag audit atlas` walkthrough has twelve moments, eleven deterministic.

## Important distinction

Capability routing (which kind of executor) comes before model routing (which route) and Claude Code dispatch. The Model Gateway executes one already-authorized reasoning step; the supervisor decides what the result means. The state machine is a proposed clarification. The scaffolded Wave-1 audit skeleton reached review with 310 tests green and zero model calls.

## Recall prompts — unanswered

Why is a Hermes job not a prompt? Separate capability routing, model routing and Claude Code dispatch. What does the zero-model-call skeleton argue about the gateway's placement?

## Verification boundary

The implementation results and measurements described above are claims documented in the lesson; they were **not independently rerun** while preparing this record. To promote glossary terms or mark comprehension as demonstrated, complete the lesson exercise, answer the recall prompts without notes, and append a dated evaluation with observed evidence. Existing learning assessments must not be inferred from lesson text.
