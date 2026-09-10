The tool’s hosting and execution moved out of Hermes. In Lesson 0008, Hermes owned the tool definition, schema, argument validation, and handler; in Lesson 0013, the MCP server owns these and exposes them over stdio. The decision to request a tool remains with the model/client side, while Hermes will retain supervision, permissions, budgets, and policy when MCP is integrated; the current lab has no model and uses the probe or Inspector as the client.
The graph index is a resource because it is stable, URI-addressed data that the client can read directly with resources/read, without asking a model to select a tool. If everything becomes a tool, simple lookups consume model turns and budget, while data retrieval, model decisions, and executable actions become unnecessarily mixed.
The two failure channels are:
In-band tool failure: a normal JSON-RPC result containing isError: true, such as the refusal of query: 42. It is meant for the model or tool-calling loop, which can understand the message, correct the arguments, and retry.
Protocol-level failure: a JSON-RPC error object, such as -32603 for graph://node/nope. It is meant for the MCP client or operator, because the request itself—such as its URI, method, or target—must be corrected.

---

## Evaluation (appended 2026-09-10, alongside lesson 0014)

All three answers are correct at mechanism level, with no prompting and no notes.

1. **Correct, with the split stated at the right layer.** What moved: hosting, schema, argument validation and the handler, now owned by the server and exposed over stdio. What stayed: the decision to call, with the model or client. The answer adds what the lesson's status table says and the question did not ask: Hermes keeps supervision, permissions, budgets and policy when MCP is integrated, and the current lab's client is the probe or Inspector, not a model. That is the lesson-0016 seam named before the lesson exists.
2. **Correct, and the cost argument is the lesson's.** A resource is stable, URI-addressed data a client reads by its own choice with `resources/read`, and no model turn is spent. The loss when everything is a tool is named twice: model turns and budget spent on lookups, and three kinds of thing (data retrieval, model decisions, executable actions) mixed into one surface. The second point is sharper than the lesson's own wording.
3. **Correct, both channels with their audience.** In-band: a normal result with `isError: true`, for the model or tool-calling loop, which can read the message, fix the arguments and retry. Protocol-level: a JSON-RPC `error` object such as `-32603`, for the client or operator, because the request itself must be corrected. The example pairing (`query: 42` vs `graph://node/nope`) matches the measured run.

**Promotions:** [[mcp]] → `demonstrated` (answer 1 is a complete account of what a server owns and what stays with the client, in the protocol's own terms). [[resource]] → `demonstrated` (answer 2 states the definition, the mechanism and the cost of getting it wrong). [[transport]] stays `introduced`: "over stdio" is named, but the transport's two rules (it owns stdout, the client owns the server's lifetime) are not exercised. [[json-rpc]] stays `introduced`: the result and error objects are used correctly, but id-matching, the mechanism the lesson measured, is untouched. Lesson 0015's scripted client is the next workout for both.

