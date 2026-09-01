The fake versus the fixtures

The FakeModelGateway proves the supervisor’s provider-neutral policy because it replaces the system at the ModelGateway port. It can script arbitrary replies and test:

call caps and budget ceilings;
permitted and refused tools;
default, operator-approved and operator-denied calls;
trace ordering;
resume and carried accounting.

Fixtures cannot directly prove the adapter-independent nature of those policies because they exercise one fixed sequence of recorded exchanges.

Recorded fixtures prove what the fake cannot: the real Anthropic adapter and SDK translations. They verify that:

ModelCall becomes the correct HTTP request body;
transcript turns become the correct messages array;
streamed SSE bytes become a validated ModelReply;
429 and 401 responses become the correct GatewayFailure;
malformed provider data is refused at the adapter boundary.

The fake bypasses the adapter and SDK completely, so it sees no wire representation.

Meaning of a second-request mismatch

A mismatch means that Hermes received the first recorded reply but failed to reconstruct the same conversation state and wire request that originally produced the second exchange.

The possible break lies somewhere in this chain:

first reply
→ model turn added to transcript
→ tool call gated and executed
→ tool result paired with call ID
→ complete transcript sent to adapter
→ second HTTP request generated

One bug it catches is removing:

transcript.push({ from: "model", ... });

The second request would then omit the model’s tool_use turn. Its transcript and pairing structure would differ from the recording, so the byte comparison would fail. It could similarly catch a lost tool result, wrong pairing ID or incorrect turn ordering.

What remains unproven

Two important claims remain unproven despite all 29 tests being green:

Mid-generation timing behaviour: replayed responses arrive as complete buffered bodies, while the fake answers immediately. Therefore, the in-flight budget abort, retained partial text, deadline race and approval race must be proven against the paced live mock server.
The real provider’s current contract: fixtures preserve the mock’s previously recorded behaviour, not Anthropic’s present behaviour. Provider drift, real error wording and actual wire compatibility must be checked through a live run against the real Anthropic API.

So the correct conclusion is not “the whole external system is proven.” It is:

The offline suite proves Hermes’s side of its contracts; the live mock proves timing, and the real API proves the provider’s side.

---

## Evaluation (appended 2026-09-02, alongside lesson 0013)

All three answers are correct at mechanism level, with no prompting and no notes.

1. **Correct, both directions.** The fake proves port-level policy because it replaces the system at the `ModelGateway` port, and the listed coverage (caps, ceilings, both permission outcomes, approval paths, trace ordering, resume accounting) matches the supervisor suite. The reverse direction is stated with its reason: fixtures replay one fixed sequence, so they cannot show the policy is adapter-independent. The closing line — the fake bypasses adapter and SDK, "so it sees no wire representation" — is the lesson's stand-in table, derived rather than quoted.
2. **Correct, and names the README's actual break experiment unprompted.** A mismatch is read as a state-reconstruction failure between call 1's reply and call 2's request, with the full chain (reply → transcript turn → gate → tool result paired by id → transcript → request bytes). The named bug — deleting the supervisor's model-turn push — is the experiment the lab ships, and the predicted failure mode (missing `tool_use` turn, broken pairing, byte mismatch) is what the suite measured.
3. **Correct.** Both unproven claims are named with their mechanism: replayed bodies arrive whole and the fake answers instantly, so every timing claim (mid-generation abort, kept partial, deadline and approval races) stays with the paced mock; fixtures freeze the mock's past behavior, so provider drift and real error wording need a live run. The closing three-way split (offline suite → Hermes's side, mock → timing, real API → the provider's side) is the lesson's compression, reconstructed.

**Promotions:** [[fixture]] → `demonstrated` (all three answers use recorded-and-replayed exchanges correctly: what they prove, what they cannot, and why). [[fake]] → `demonstrated` (answer 1 is a complete, correct account of the fake's depth and blind spot). [[json-lines]] stays `introduced` — no answer touches the format; its workout remains the fixture files. [[default-deny]] stays `introduced` — answer 1 lists the approval outcomes but still does not state the rule; lesson 0013's gate-free surface offers no workout, so the next chance is lesson 0016, where the loop meets these tools.