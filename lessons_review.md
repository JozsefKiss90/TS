

## The first three lessons

| Lesson                            | Main question                                                  | What you learned                                                                                     |
| --------------------------------- | -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| 1. Trace one request              | What lies between your code and the API?                       | The six API responsibilities and how an SDK hides their mechanics                                    |
| 2. Raw HTTP against a mock        | What happens when you perform those responsibilities yourself? | How to construct, send, parse, cancel, and handle errors with `fetch()`                              |
| 3. The SDK absorbs the six        | What does the official SDK do for you?                         | It automates the same HTTP work while adding compile-time types, retries, timeouts, and typed errors |
| 4. The response becomes a process | What if the answer arrives gradually?                          | The successful response becomes an event stream that can be observed and cancelled mid-generation    |

The recurring six responsibilities are:

1. Endpoint
2. Authentication
3. API version
4. Request and response contract
5. Errors and retries
6. Cancellation and timeout

### Lesson 1: API versus SDK

Lesson 1 compared two ways of making the same request:

```ts
fetch("https://api.anthropic.com/v1/messages", ...)
```

versus:

```ts
client.messages.create(...)
```

The API defines what crosses the network: endpoint, headers, request body, response body and errors.

The SDK is a TypeScript library that handles much of that protocol for you. It does not replace the API; it produces requests that conform to the API.

Lesson 1 also introduced the SDK’s response type:

```ts
Message
```

and explained an important limitation: the SDK parses the JSON and then treats the result as a `Message`. TypeScript checks how your code uses that object, but normally does not validate every incoming field at runtime.

### Lesson 2: writing the raw client

Lesson 2 made you implement the responsibilities manually:

```ts
const response = await fetch(url, {
  method: "POST",
  headers: {
    "content-type": "application/json",
    "x-api-key": apiKey,
    "anthropic-version": "2023-06-01",
  },
  body: JSON.stringify({
    model,
    max_tokens,
    messages,
  }),
  signal: controller.signal,
});
```

You then had to:

* inspect `response.ok`;
* parse success and error JSON;
* read headers such as `request-id` and `retry-after`;
* define your own response interfaces;
* handle cancellation;
* discover malformed requests from server-side `400` responses.

The mock server acted as a test double for the real Anthropic API.

### Lesson 3: using the SDK

Lesson 3 replaced the raw implementation with:

```ts
const message = await client.messages.create({
  model,
  max_tokens,
  messages,
});
```

The same request still reached the same endpoint. The SDK absorbed the mechanics:

* endpoint construction;
* authentication and version headers;
* `JSON.stringify`;
* response parsing;
* TypeScript request and response types;
* automatic retries;
* `retry-after`;
* typed error classes;
* timeouts and cancellation plumbing.

It also distinguished:

```ts
params   // what the request asks for
options  // how this particular HTTP call should behave
```

For example:

```ts
await client.messages.create(
  {
    model,
    max_tokens,
    messages,
  },
  {
    maxRetries: 0,
    timeout: 200,
    signal: controller.signal,
  },
);
```

## What exactly is a `Message`?

The word “message” is being used at several levels, which contributes to the confusion.

| Term                        | Meaning                                                   |
| --------------------------- | --------------------------------------------------------- |
| `messages` request property | The conversation turns sent to the model                  |
| `Message` response object   | The complete assistant response returned by the API       |
| stream event                | One notification containing part of the evolving response |
| `MessageStream`             | An SDK object that observes and assembles those events    |

An abridged response `Message` looks like this:

```ts
interface Message {
  id: string;
  type: "message";
  role: "assistant";
  model: string;
  content: ContentBlock[];
  stop_reason: StopReason | null;
  stop_sequence: string | null;
  usage: Usage;
}
```

A typical runtime value might be:

```ts
{
  id: "msg_mock_0001",
  type: "message",
  role: "assistant",
  model: "claude-opus-4-8",
  content: [
    {
      type: "text",
      text: "Hello from the mock!"
    }
  ],
  stop_reason: "end_turn",
  stop_sequence: null,
  usage: {
    input_tokens: 12,
    output_tokens: 5
  }
}
```

The response is composed of content blocks because an assistant response need not contain only text. It might contain text, tool calls, thinking blocks or other supported block types.

## What does `client.messages.create()` do?

`client.messages` is the SDK resource corresponding to the `/v1/messages` endpoint. `.create()` asks that resource to create an assistant response.

The method has two relevant TypeScript overloads:

```ts
create(
  params: MessageCreateParamsNonStreaming
): APIPromise<Message>;

create(
  params: MessageCreateParamsStreaming
): APIPromise<Stream<RawMessageStreamEvent>>;
```

An overload means that the return type depends on the arguments.

Without streaming:

```ts
const message = await client.messages.create({
  model,
  max_tokens,
  messages,
});
```

TypeScript sees:

```ts
message: Message
```

With streaming:

```ts
const events = await client.messages.create({
  model,
  max_tokens,
  messages,
  stream: true,
});
```

TypeScript sees approximately:

```ts
events: Stream<RawMessageStreamEvent>
```

So `.create()` does not always return the same kind of value:

* without `stream: true`, it waits for and returns the complete `Message`;
* with `stream: true`, it returns an asynchronous source of events.

This is selected at compile time from the literal `stream: true`.

## JSON response versus event-stream response

This is the missing bridge in lesson 4.

### Non-streaming request

The request is one JSON document:

```http
POST /v1/messages
Content-Type: application/json

{
  "model": "claude-opus-4-8",
  "max_tokens": 1024,
  "messages": [
    {
      "role": "user",
      "content": "Hello"
    }
  ]
}
```

The successful response is also one JSON document:

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "id": "msg_123",
  "type": "message",
  "role": "assistant",
  "content": [
    {
      "type": "text",
      "text": "Hello!"
    }
  ],
  "stop_reason": "end_turn",
  "usage": {
    "input_tokens": 10,
    "output_tokens": 4
  }
}
```

The SDK can conceptually do:

```ts
const parsed = await response.json();
return parsed as Message;
```

Your code receives nothing until the complete body has arrived and been parsed.

### Streaming request

The request is still an `application/json` document. It merely contains one additional property:

```http
POST /v1/messages
Content-Type: application/json

{
  "model": "claude-opus-4-8",
  "max_tokens": 1024,
  "messages": [
    {
      "role": "user",
      "content": "Hello"
    }
  ],
  "stream": true
}
```

It is the successful response whose media type changes:

```http
HTTP/1.1 200 OK
Content-Type: text/event-stream
```

Its body might look like:

```text
event: message_start
data: {"type":"message_start","message":{"id":"msg_123","type":"message","role":"assistant","content":[],"stop_reason":null}}

event: content_block_start
data: {"type":"content_block_start","index":0,"content_block":{"type":"text","text":""}}

event: content_block_delta
data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"Hello"}}

event: content_block_delta
data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"!"}}

event: content_block_stop
data: {"type":"content_block_stop","index":0}

event: message_delta
data: {"type":"message_delta","delta":{"stop_reason":"end_turn"},"usage":{"output_tokens":4}}

event: message_stop
data: {"type":"message_stop"}
```

The overall HTTP body is not a JSON document. It is SSE-formatted text containing multiple event frames.

Each `data:` value happens to contain JSON, so the SDK repeatedly:

1. finds the next SSE event;
2. reads its `event:` name;
3. parses the JSON after `data:`;
4. yields the resulting event object;
5. continues waiting for later events.

The contrast is therefore:

| Non-streaming                             | Streaming                                      |
| ----------------------------------------- | ---------------------------------------------- |
| Response media type is `application/json` | Response media type is `text/event-stream`     |
| Body is one JSON document                 | Body is a sequence of SSE frames               |
| JSON is parsed once                       | Each event’s `data` JSON is parsed separately  |
| Complete answer appears at once           | Partial information appears progressively      |
| Result is a `Message`                     | Raw result is a stream of events               |
| Cancellation usually leaves no answer     | Mid-stream cancellation can leave partial text |

Even a non-streaming HTTP response physically travels in network chunks. The difference is that those chunks are buffered and hidden from your application until the complete JSON document can be parsed. SSE exposes meaningful records while the response is still being produced.

## Does streaming change the contract?

There are several different contracts here:

| Contract layer                         | Does it change?               |
| -------------------------------------- | ----------------------------- |
| Endpoint: `POST /v1/messages`          | No                            |
| Authentication and version headers     | No                            |
| Request media type: `application/json` | No                            |
| Request body                           | Slightly: adds `stream: true` |
| Model’s logical answer                 | No                            |
| Final assembled `Message` shape        | No                            |
| Successful HTTP response media type    | Yes                           |
| Successful response-body grammar       | Yes                           |
| Timing and cancellation behaviour      | Yes                           |

A more accurate sentence than the lesson’s would be:

> Streaming preserves the logical result but changes the response representation and lifecycle.

Also note that if the request fails before streaming begins—for example because authentication is missing—the API can still return an ordinary JSON error response. `stream: true` determines how a successful generated answer is delivered.

## What is a discriminated union?

You already encountered one in lesson 1 through `ContentBlock`.

Imagine:

```ts
type ContentBlock =
  | { type: "text"; text: string }
  | { type: "tool_use"; name: string; input: unknown };
```

This is a union: a value can have either shape.

The `type` property is the discriminator. Its literal value tells TypeScript which member you have:

```ts
function handleBlock(block: ContentBlock) {
  if (block.type === "text") {
    console.log(block.text);
  } else {
    console.log(block.name);
  }
}
```

Before the check, TypeScript only knows:

```ts
block: ContentBlock
```

After:

```ts
block.type === "text"
```

it knows:

```ts
block: { type: "text"; text: string }
```

Stream events use the same pattern:

```ts
type RawMessageStreamEvent =
  | {
      type: "message_start";
      message: Message;
    }
  | {
      type: "content_block_delta";
      index: number;
      delta: ContentBlockDelta;
    }
  | {
      type: "message_delta";
      delta: MessageDelta;
      usage: MessageDeltaUsage;
    }
  | {
      type: "message_stop";
    };
```

You narrow it using `event.type`:

```ts
for await (const event of events) {
  switch (event.type) {
    case "message_start":
      console.log(event.message.id);
      break;

    case "content_block_delta":
      if (event.delta.type === "text_delta") {
        console.log(event.delta.text);
      }
      break;

    case "message_delta":
      console.log(event.delta.stop_reason);
      break;

    case "message_stop":
      console.log("Finished");
      break;
  }
}
```

The union is “discriminated” because every member carries the same distinguishing property—here, `type`—with a different literal value.

## “Two SDK surfaces for one wire format”

This does not mean two SDKs. It means two public interfaces in the same Anthropic SDK for consuming the same SSE response.

### Surface 1: raw events

```ts
const events = await client.messages.create({
  model,
  max_tokens,
  messages,
  stream: true,
});

for await (const event of events) {
  console.log(event.type);
}
```

Here you receive the events close to their wire-level representation. You must decide what each event means and, if needed, accumulate them into your own final state.

This is the lower-level surface.

### Surface 2: `MessageStream` helper

```ts
const stream = client.messages.stream({
  model,
  max_tokens,
  messages,
});

stream.on("text", (delta, snapshot) => {
  console.log("New text:", delta);
  console.log("Text so far:", snapshot);
});

const finalMessage = await stream.finalMessage();
```

The helper:

* parses the same SSE events;
* maintains the partially assembled message;
* emits convenient `"text"` notifications;
* distinguishes the new delta from the full snapshot;
* provides `currentMessage`;
* constructs the final `Message`;
* provides `finalText()` and `finalMessage()`;
* supports cancellation.

Both surfaces cause essentially the same streaming request:

```http
POST /v1/messages
...
{"stream":true,...}
```

They differ only in how much client-side work the SDK performs after receiving the events.

| Raw `create({stream: true})`        | `messages.stream()` helper                             |
| ----------------------------------- | ------------------------------------------------------ |
| Gives individual API events         | Gives a managed `MessageStream`                        |
| Closest to the wire contract        | Higher-level convenience interface                     |
| You interpret and accumulate events | SDK accumulates them                                   |
| Useful when every event matters     | Useful when you mainly want text and the final message |

## How is the final `Message` reconstructed?

Conceptually, the helper performs a fold—meaning repeated state updates.

It starts with the skeleton:

```ts
{
  id: "msg_123",
  type: "message",
  role: "assistant",
  content: [],
  stop_reason: null,
  usage: {
    input_tokens: 10,
    output_tokens: 0
  }
}
```

Then it applies events:

```text
message_start
      ↓
add content block
      ↓
append "Hello"
      ↓
append "!"
      ↓
close content block
      ↓
set stop_reason and final output_tokens
      ↓
final Message
```

The result is:

```ts
{
  id: "msg_123",
  type: "message",
  role: "assistant",
  content: [
    {
      type: "text",
      text: "Hello!"
    }
  ],
  stop_reason: "end_turn",
  usage: {
    input_tokens: 10,
    output_tokens: 4
  }
}
```

That final object never existed as one JSON response body. The SDK constructed it locally from the event sequence.

This also explains why:

```ts
finalMessage._request_id
```

may be `undefined` on the helper-produced object. The request ID comes from the HTTP response headers, not from the reconstructed `Message`. It therefore belongs to:

```ts
stream.request_id
```

## What lesson 4 is really adding

Lesson 4 contains four genuinely new ideas:

1. **SSE response framing:** one held-open HTTP response contains multiple named events.
2. **Async iteration:** `for await` processes values that become available over time.
3. **Incremental reconstruction:** events progressively build the final `Message`.
4. **Mid-generation cancellation:** aborting can preserve partial output and prevent the remaining output from being generated.

The key knowledge timeline is:

* At `message_start`, the client knows the message ID, model and input tokens.
* During `content_block_delta`, it receives the answer text.
* Near the end, `message_delta` provides `stop_reason` and final output tokens.
* At `message_stop`, the complete response process is over.

The final token count and stopping reason cannot arrive at the beginning because the model has not finished generating yet.

## What to focus on before continuing

I would reduce the lesson to these five statements:

1. `Message` remains the complete assistant-response object.
2. `stream: true` changes `.create()` from returning one `Message` to returning an asynchronous sequence of events.
3. The request remains JSON; the successful response changes from JSON to SSE.
4. `event.type` identifies the shape of each event—that is a discriminated union.
5. `client.messages.stream()` is a higher-level helper that reconstructs the final `Message` for you.

Once those distinctions are clear, the cancellation section follows naturally: non-streaming cancellation interrupts waiting for a value, while streaming cancellation interrupts the production of an evolving value.
