# Agentic Engineering with TypeScript — Resources

## Knowledge

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
  Canonical language reference. Use for: narrowing, discriminated unions, generics, `unknown` — always via a Hermes-shaped example, never as syntax tourism.
- [Anthropic TypeScript SDK (GitHub)](https://github.com/anthropics/anthropic-sdk-typescript)
  The primary SDK we dissect in Phase 0. Use for: client construction, request options (timeout, retries, `signal`), typed errors, response types, streaming helpers. Read the README *and* the generated `.d.ts` files.
- [Claude API docs — client SDKs](https://platform.claude.com/docs/en/api/client-sdks) and [Messages API](https://platform.claude.com/docs/en/api/messages)
  The wire contract underneath the SDK (docs.anthropic.com now redirects here). Use for: endpoint, headers, request/response shapes, stop reasons, errors.
- [Claude tool-use overview](https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview)
  Use for: tool definitions, `tool_use`/`tool_result` blocks, the manual agentic loop — the heart of Phase 1.
- [Zod documentation](https://zod.dev/)
  Runtime validation at JSON boundaries. Use for: TaskSpec validation, tool argument/result schemas, parsing untrusted model output.
- [MCP introduction](https://modelcontextprotocol.io/docs/getting-started/intro), [MCP SDKs](https://modelcontextprotocol.io/docs/sdk), [server guide](https://modelcontextprotocol.io/docs/develop/build-server), [Inspector](https://modelcontextprotocol.io/docs/tools/inspector)
  Phase 2. Use for: exposing the Graph RAG surface as typed tools, testing servers without an LLM.
- [Claude Agent SDK overview](https://docs.anthropic.com/en/docs/claude-code/sdk)
  Phase 5 only — deliberately held back until the manual loop is understood.
- [LangGraph.js overview](https://docs.langchain.com/oss/javascript/langgraph/overview) and [Thinking in LangGraph](https://docs.langchain.com/oss/javascript/langgraph/thinking-in-langgraph)
  Phase 3 candidate for state-graph orchestration, persistence, interruption. Do not learn alongside Mastra.
- [OpenTelemetry JavaScript](https://opentelemetry.io/docs/languages/js/)
  Phase 4. Use for: traces, spans, cost/latency accounting on the Hermes loop.
- [Temporal SDK concepts](https://docs.temporal.io/encyclopedia/temporal-sdks)
  Later. Use for: durable execution vocabulary (checkpointing, replay) once the manual loop exposes the need.

## Wisdom (Communities)

- [Anthropic Discord](https://www.anthropic.com/discord)
  Official community; #api and SDK channels. Use for: SDK behavior questions no doc answers, sanity-checking harness designs.
- [MCP GitHub Discussions](https://github.com/orgs/modelcontextprotocol/discussions)
  Protocol authors and server builders. Use for: MCP server design and Inspector issues in Phase 2.
- User's community preference not yet recorded — confirm before proposing more.

## Gaps

- No vetted primary source yet for evaluating agent harnesses (golden tasks, replayable fixtures) — search when Phase 4 approaches.
- Graph RAG evidence-schema design references — the user has practical experience; find a high-trust written source before Phase 2 to compare against.
