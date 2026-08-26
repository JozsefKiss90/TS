The three permission levels are:
Unlisted / not_permitted: the tool is absent from allowedTools; gateToolCall classifies it, and runTool enforces the refusal.
Permitted / auto: the tool is in allowedTools but not approvalRequired; gateToolCall lets it proceed directly to runTool.
Permitted with approval / hold: the tool is in both lists; gateToolCall holds it, while the ApprovalPort supplies the eventual approved-or-denied decision.
allowedTools decides whether the job possesses a tool capability at all, whereas approvalRequired decides whether a permitted call may run autonomously. Without approvalRequired, every allowed tool—including mutating tools such as graph_writeback—would run without human review.
An approver may never answer, so an unrestricted approval promise could hang the job indefinitely and break Lesson 0009’s termination guarantee. Sharing the job’s AbortController lets raceBounds end the wait when the deadline, budget signal, or operator cancellation fires, producing a classified outcome such as out_of_time instead of leaving the job pending forever.

---

## Evaluation (appended 2026-08-25, alongside lesson 0011)

All three answers are correct at mechanism level, with no prompting and no notes.

1. **Correct, complete.** All three levels with the deciding layer named for each — including the split the lesson cares about most: `gateToolCall` *classifies* an unlisted name, while `runTool` *enforces* the refusal. The hold arm correctly separates the gate (holds) from the `ApprovalPort` (decides).
2. **Correct.** The two fields' distinct jobs stated as capability vs. autonomy: `allowedTools` decides whether the job possesses the tool at all, `approvalRequired` decides whether a permitted call runs unattended. The `graph_writeback` example shows why collapsing them would remove human review from mutating tools.
3. **Correct, and beyond the asked scope.** Names the exact failure (an unresolvable promise breaks the lesson-0009 termination guarantee), the mechanism (`raceBounds` listening to the shared controller), all three firing sources, and the classified outcome. This connects two lessons' guarantees unprompted.

**Promotions:** [[approval-gate]] → `demonstrated` (answers 1 and 3 exercise the gate's three answers, the hold/decide split, and the wait's termination behavior). [[default-deny]] stays `introduced` — no answer states the rule itself (whatever cannot be decided is refused; no channel means denial, and the empty `approvalRequired` default is the deliberate permissive exception). Cleanest workout: lesson 0011's say-it or the next lab session.