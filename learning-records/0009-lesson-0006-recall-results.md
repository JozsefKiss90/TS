**Port:** A port is a Hermes-owned interface that defines, in domain vocabulary, what the supervisor can ask of a model service and what results it can receive.

**Adapter:** An adapter is a concrete runtime implementation of that port that translates between Hermes’s types and a specific provider SDK’s requests, replies, and errors.

The `ModelGateway` port itself does **not** survive compilation because TypeScript interfaces and type aliases are erased. What survives is the adapter class, such as `AnthropicModelGateway`; the erased port is enforced at compile time by the TypeScript type-checker through `implements ModelGateway` and through the types used by callers. The actual runtime guard is separate: the Zod boundary parse inside the adapter.

### 1. Trace a 429 from wire to supervisor

The mock sends an HTTP **429** response over the wire. The Anthropic SDK receives those bytes and turns the failed HTTP response into a runtime `RateLimitError` object. The SDK therefore hands the adapter an **exception**, specifically a `RateLimitError`.

Inside `AnthropicModelGateway`, `classifyFailure()` recognizes that exception and translates it into Hermes-owned failure data:

```ts
{
  kind: "throttled",
  retryAfterMs: 5000
}
```

So the path is:

```text
HTTP 429 bytes
→ Anthropic SDK
→ RateLimitError
→ AnthropicModelGateway
→ { kind: "throttled", retryAfterMs: 5000 }
→ ModelGateway result
→ supervisor
→ policy decision: retry_later
```

The adapter therefore answers **what happened**—the provider throttled the call—while the supervisor decides **what Hermes should do about it**—in this exercise, `retry_later`.
`instanceof RateLimitError` works because `RateLimitError` is a JavaScript class and therefore survives compilation as a real runtime constructor. `ModelGateway`, by contrast, is a TypeScript interface and is erased completely, so there is no runtime `ModelGateway` constructor against which `instanceof` could operate.

### 2. Why `safeParse` is not redundant

The installed SDK declaration promises at compile time that `messages.create()` returns a value typed as `Message`, but that type declaration is erased and therefore cannot prove that the actual HTTP response bytes conform to that shape at runtime. `WireReplySchema.safeParse()` is the actual runtime check: it verifies the specific fields Hermes consumes before those values are allowed across the gateway boundary, which is why the malformed `"42"` token count and `"end-turn"` stop reason are rejected instead of reaching the ledger.

### 3. Provider-neutrality decision

The decision is: **provider-neutral port, exactly one live adapter**.

The strongest argument is that neutrality is a property of the **seam**, not of the number of providers implemented. `gateway.ts` contains only Hermes concepts—`ModelCall`, `ModelReply`, `StopCause`, `GatewayFailure`, and `ModelGateway`—and contains no Anthropic types or vocabulary. Therefore Hermes policy depends on its own abstraction rather than on the provider SDK.

The risk is that a port designed while only one real provider exists may gradually become **Anthropic-shaped**: provider-specific assumptions could leak into what is supposed to be a neutral interface.

The mitigation present from day one is `FakeModelGateway`. It is a second implementation of the same port that contains no Anthropic dependency. If the fake can implement `ModelGateway` naturally, that provides pressure against introducing Anthropic-specific requirements into the contract. It does not prove interoperability with another real provider, but it helps keep the seam honest without prematurely building a second live adapter.
