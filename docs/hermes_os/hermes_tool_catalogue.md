
# Hermes / Claude Code Operating-System Tool Catalogue

This catalogue consolidates the tools, technologies, repos, models, platforms, capabilities, and architectural components mentioned in the attached chat history, Hermes video extracts, and the current conversation. It is intentionally broad: it includes not only installable software, but also Hermes-native features, Claude Code extension points, evaluation harnesses, command surfaces, infrastructure components, and proposed internal repos/templates.

**Source key**: `Chat` = attached chat history and this conversation; `Video` = Hermes YouTube extract files; `Current` = explicit discussion in this conversation outside the attached chat history.

**Status key**:
- **Core v1** — should be part of the first serious Claude/Hermes OS build.
- **Core later** — important, but after the minimum controlled workflow works.
- **Adapter** — use as a supporting subsystem, not the canonical authority.
- **Skill / rule** — convert into a reusable Claude/Hermes skill, instruction, or policy.
- **Optional / benchmark** — track or benchmark, but do not depend on it initially.
- **Delay / guarded** — powerful or risky; use only after admission review.
- **Reference / concept** — architectural concept, not directly installed software.

## 1. Hermes Core Runtime, Memory, Skills, and Operating-System Features
| Tool / Item | Type | Primary role / capability | Scope | Architectural layer | Status / decision | Mentioned in |
|---|---|---|---|---|---|---|
| Hermes Agent | Open-source agent harness | Persistent controller, scheduler, memory layer, messaging gateway, skill/profile host | Hermes | Orchestration / OS | Core v1 | Chat; Video |
| NousResearch/hermes-agent | GitHub repo | Canonical Hermes implementation to install/fork/configure | Hermes | Orchestration / OS | Core v1 | Chat; Video |
| Hermes profile distributions | Packaging mechanism | Bundle SOUL, skills, cron jobs, MCP config, model/provider settings, and persona defaults | Hermes | Distribution / packaging | Core v1 | Chat |
| SOUL.md | Hermes identity file | Defines agent identity, tone, purpose, and persona; can evolve with feedback | Hermes | Memory / identity | Core v1 | Video |
| USER.md | Hermes memory file | Durable facts about the user, preferences, style, constraints | Hermes | Memory | Core v1 | Video |
| MEMORY.md | Hermes memory file | Durable environment/project/business context | Hermes | Memory | Core v1 | Video |
| AGENTS.md / agents.md | Project context file | Shared project goal/context file; interoperability with other coding agents | Hermes; Claude Code; other agents | Context / constitution | Core v1 | Chat; Video |
| CLAUDE.md | Claude Code constitution | Project-level rules, canonical commands, safety constraints, output contracts | Claude Code | Context / constitution | Core v1 | Chat; Current |
| Skills / SKILL.md | Procedural memory | Reusable playbooks with YAML front matter and progressive disclosure | Hermes; Claude Code | Skills | Core v1 | Chat; Video |
| Skills Hub | Skill marketplace / repository | Discover/install community and official skills | Hermes | Skill distribution | Core later | Video |
| Built-in Hermes skills | Default skill library | Out-of-box skills including creative/media/transcription/voice-like capabilities in the examples | Hermes | Skills | Core v1 | Video |
| Creative skill | Hermes skill | Creative/media generation task capability used in video demo | Hermes | Skills / media | Optional | Video |
| Manim video skill | Hermes skill | Generate animated explanatory videos | Hermes | Skills / media | Optional | Video |
| Generate image skill | Hermes skill | Image generation workflow with YAML-frontmatter skill metadata | Hermes | Skills / media | Optional | Video |
| Canvas design skill | Official/community skill | Design/canvas workflow skill mentioned in Skills Hub example | Hermes; Claude | Skills / design | Optional | Video |
| Front-end design skill | Official/community skill | Front-end/UI design workflow skill mentioned in Skills Hub example | Hermes; Claude | Skills / design | Optional | Video |
| Skill creator skill | Meta-skill | Generate or patch new skills after repeated work | Hermes; Claude Code | Self-improvement | Core v1 | Video |
| Self-improving loop | Capability / operating pattern | Persist useful experience into memory, skills, and searchable history | Hermes | Learning loop | Core v1 with governance | Chat; Video |
| Search past conversations | Memory retrieval capability | Retrieve older session context by date/topic; avoid re-explaining | Hermes | Memory retrieval | Core v1 | Video |
| SQLite session database | Local database | Stores/searches sessions/history in Hermes examples | Hermes | Memory persistence | Core v1 | Video |
| Cron / scheduled automations | Hermes scheduling primitive | Run proactive scheduled tasks in fresh isolated sessions | Hermes | Scheduling / loop automation | Core v1 | Chat; Video |
| context_from | Cron chaining option | Pass one scheduled job output into another job | Hermes | Scheduling / workflow composition | Core later | Video |
| work_dir | Cron execution option | Run scheduled tools from a specific project folder | Hermes | Scheduling / repo context | Core v1 | Video |
| --no-agent | Cron/script mode | Run a script/workflow without the full agentic loop | Hermes | Scheduling / deterministic execution | Core v1 | Video |
| Dreaming function / dream sequence | Reflective automation | Overnight review of conversations, skills, goals, usage, and improvement opportunities | Hermes OS | Reflection / optimisation | Core later with privacy guardrails | Video; Current |
| Morning brief | Scheduled report | Summarize dream-cycle insights and next suggestions | Hermes | Reporting | Core later | Video |
| Mission Control | Visual OS feature | Track mid-term goals, owner roles, questions, actions, and progress | Hermes OS | Visual operations | Core later | Video |
| Pantheon | Persona/skill dashboard | Visualize personas, jobs, descriptions, system prompts, and preferred models | Hermes OS | Persona/model routing | Core later | Video |
| Personas / primes | Agent role configuration | Assign jobs and preferred models to named Hermes personas | Hermes | Persona routing | Core later | Video |
| Agent Reach | Capability / integration layer | Map what the agent can access and act upon across tools, accounts, data, and channels | Hermes OS | Capability governance | Core later | Current |
| Visual intelligence layer / agentic OS dashboard | Custom UI / dashboard | Unify conversations, memory, tools, costs, skills, artifacts, goals, and connections | Hermes; Claude Code | OS / observability | Core later | Video |
| Artifact persistence / artifact vault | OS feature | Persist chat-generated reports, documents, dashboards, code outputs, and plans instead of losing them in chat | Hermes OS | Artifact management | Core later | Video |
| Onboarding workflow / software detection | Setup workflow | Detect installed software, paths, API-key requirements, and local integrations | Hermes OS | Setup / configuration | Core later | Video |
| ROI / time-saved tracking | Analytics feature | Estimate time saved and value generated by skills/automations | Hermes OS | Analytics | Core later | Video |
| Cost dashboard / AI spend dashboard | Analytics feature | Visualize spend by platform/model/hour/day and identify wasted plan capacity | Hermes OS | Cost control | Core v1 minimal; Core later full UI | Chat; Video |
| /steer | Hermes command | Guide an active task before completion | Hermes | Interactive control | Core later | Video |
| /background | Hermes command | Run a separate background task while the current task continues | Hermes | Interactive control | Core later | Video |
| /handoff | Hermes command | Transfer context/task between sessions/agents/workflows | Hermes | Workflow handoff | Core later | Video |
| /clear | Hermes command | Clear/reset conversation context | Hermes | Session control | Core v1 | Video |

## 2. Messaging, Channels, Platforms, and Human Interfaces
| Tool / Item | Type | Primary role / capability | Scope | Architectural layer | Status / decision | Mentioned in |
|---|---|---|---|---|---|---|
| Telegram | Messaging gateway | Primary mobile interface for Hermes; bot token/User ID setup | Hermes | Messaging | Core v1 | Chat; Video |
| Discord | Messaging gateway | Team-channel agent interaction; infrastructure/IT support bot pattern | Hermes | Messaging / team ops | Optional / guarded | Video |
| Slack | Messaging gateway | Work/team notifications and interactions | Hermes | Messaging / team ops | Optional / guarded | Chat; Video |
| WhatsApp | Messaging gateway | Mobile chat surface | Hermes | Messaging | Optional / guarded | Video |
| iMessage | Messaging gateway | Apple messaging surface | Hermes | Messaging | Optional / guarded | Video |
| Email / Gmail | Communication connector | Read/summarize/triage/send email workflows if governed | Hermes | Communication / ops | Delay / guarded | Video; Current |
| YouTube comments | Platform workflow | Monitor/respond to comments using channel transcripts/knowledge | Hermes | Content ops | Optional | Video |
| YouTube transcripts | Source/context input | Ground comment replies, video summaries, or knowledge extraction | Hermes; RAG | Source ingestion | Optional | Video |
| X / Twitter | Source/social platform | Search/read posts for trends, links, and current signals | Hermes | Research / social intelligence | Optional / guarded | Chat; Video |
| Instagram | Source/social platform | Trend/outlier content reports and social-growth research | Hermes | Research / social intelligence | Optional | Video |
| LinkedIn | Source/social platform | Competitive/client-acquisition research workflows | Hermes | Research / social intelligence | Optional | Video |
| Browser UI / web dashboard | Human interface | Non-Telegram interface for chat, history, Mission Control, skills, costs, artifacts | Hermes OS | Visual OS | Core later | Video |
| Terminal interface | CLI interface | Direct Hermes/Claude Code operation from terminal | Hermes; Claude Code | CLI | Core v1 | Chat; Video |
| Claude mobile app remote control | Mobile control surface | Control Claude Code session from mobile via /remote-control | Claude Code | Remote operation | Optional | Current |

## 3. Claude Code, Coding Agents, Agent Runtimes, and Automation Patterns
| Tool / Item | Type | Primary role / capability | Scope | Architectural layer | Status / decision | Mentioned in |
|---|---|---|---|---|---|---|
| Claude Code | Coding agent | Repo-local implementation, refactoring, tests, MCP use, subagents, hooks, skills | Claude side | Implementation engine | Core v1 | Chat; Video; Current |
| Claude Code Action | GitHub Action | Issue/PR-based Claude Code automation and auditable implementation | Claude Code | PR automation | Core v1 | Chat |
| anthropics/claude-code-action | GitHub repo | Official Claude Code PR automation integration | Claude Code | CI/PR integration | Core v1 | Chat |
| Headless `claude -p` | CLI execution mode | Scripted jobs with structured outputs | Claude Code | Automation interface | Core v1 | Chat |
| `claude --bare -p` | CLI execution mode | Reproducible headless/local job runs | Claude Code | Automation interface | Core v1 | Chat |
| allowedTools | Claude Code permission setting | Restrict tools per job | Claude Code | Safety / permissions | Core v1 | Chat |
| Claude Code JSON output | Structured result format | Job metadata/cost/results for ledgers and harnesses | Claude Code | Automation output | Core v1 | Chat |
| JSON Schema output | Structured contract | Enforce parseable Claude Code job results | Claude Code | Automation output | Core v1 | Chat |
| Claude Code skills | Reusable procedures | Repeatable coding/RAG/devops workflows loaded on demand | Claude Code | Skills | Core v1 | Chat |
| Claude Code subagents | Specialist agents | Isolated repo-local expertise: ontology, eval, security, tests, devops | Claude Code | Subagents | Core v1 | Chat |
| Claude Code hooks | Lifecycle automation | PreToolUse/PostToolUse/Stop deterministic checks and enforcement | Claude Code | Safety / automation | Core v1 | Chat |
| PreToolUse hook | Hook | Block dangerous commands/file edits before tool execution | Claude Code | Safety gate | Core v1 | Chat |
| PostToolUse hook | Hook | Run formatting/lint/type/test/graph checks after edits | Claude Code | Verification | Core v1 | Chat |
| Stop / SessionEnd hook | Hook | Write changed-files, commands, risks, cost, acceptance status | Claude Code | Run logging | Core v1 | Chat |
| Claude Code plugins | Packaging/extensibility | Reusable bundles, code intelligence, security guidance | Claude Code | Plugin layer | Core later | Chat |
| Claude Code security guidance plugin | Plugin | Prompt Claude to review changes for vulnerabilities while coding | Claude Code | Security review | Core later | Chat |
| LSP / code intelligence plugins | Plugin / code intelligence | Jump to definitions, references, type errors | Claude Code; IDE | Code intelligence | Core later | Chat |
| Cursor | AI IDE / coding agent surface | Secondary IDE/review/comparison surface; not canonical automation | Optional agent | IDE | Optional / benchmark | Chat; Current |
| Cursor Agent mode | IDE agent mode | Interactive implementation/review in Cursor | Cursor | IDE agent | Optional | Chat |
| Cursor Rules | IDE instruction system | Cursor-specific repo guidance | Cursor | IDE config | Optional | Chat |
| Cursor Skills | IDE skill system | Reusable Cursor procedures | Cursor | IDE skills | Optional | Chat |
| Cursor CLI | CLI | Command-line Cursor integration | Cursor | IDE automation | Optional | Chat |
| Cursor cloud agent | Cloud coding agent | Remote agent execution for Cursor | Cursor | IDE automation | Optional | Chat |
| OpenClaw | Agent harness | Mobile/Telegram-style agent runtime; compare with Hermes | Alternative agent | Orchestration | Optional / benchmark | Chat; Video |
| NemoClaw | Enterprise stack | NVIDIA-built enterprise stack on OpenClaw according to extract | Alternative agent | Enterprise agent runtime | Reference / optional | Video |
| OpenHands | Agent runtime | Alternative persistent/agentic coding harness | Alternative agent | Orchestration | Optional / benchmark | Chat |
| OpenCode / opencode | Coding agent / CLI | Comparative agent benchmark surface | Alternative agent | Coding agent | Optional / benchmark | Chat; Current |
| Codex CLI | Coding CLI | Comparative agent benchmark / OpenAI coding surface | Alternative agent | Coding agent | Optional / benchmark | Chat |
| OpenAI Codex | Model/provider/coding agent | Hermes model/backend option and coding powerhouse in video examples | Hermes; coding | Model / coding | Optional / model-routing | Video |
| Windsurf | AI IDE | Alternative agentic IDE mentioned alongside Cursor/Claude | Alternative agent | IDE | Optional / benchmark | Current |
| Anti-gravity | AI agent/tool surface | Alternative AI tool mentioned in visual OS/cost dashboard examples | Alternative agent | Agent/IDE | Optional / benchmark | Video |
| DeerFlow / bytedance/deer-flow | Agent harness repo | Potential later sidecar/benchmark; overlaps with Hermes orchestration | Alternative agent | Orchestration / research | Optional / benchmark; do not depend in v1 | Chat; Current |
| Ponytail / DietrichGebert/ponytail | Coding-discipline repo | Convert into minimal-diff/reuse-first Claude Code skill | Claude Code | Coding policy | Skill / rule | Chat; Current |
| Grill Me / mattpocock/skills | Skill repo/pattern | Adversarial interrogation before implementation | Hermes; Claude Code | Design gate | Skill / rule | Chat; Current |
| Grill with Docs | Skill/pattern | Grill session that produces documentation such as ADRs/glossaries | Hermes; Claude Code | Design gate / docs | Optional / useful | Current |
| Loop Engineering / cobusgreyling/loop-engineering | Loop methodology repo | State, budget, audit, cadence, report-only first loops, human gates | Hermes; Claude Code | Loop governance | Core v1 concept | Current |
| CodeGraph / colbymchenry/codegraph | Code topology MCP/index | Live AST-derived symbols, callers/callees, impact radius, affected tests | Claude Code; Hermes | Code intelligence adapter | Adapter / Core v1 if stable | Current |

## 4. Ontology-Grounded RAG, Knowledge Graph, Obsidian, and Context-Pack Layer
| Tool / Item | Type | Primary role / capability | Scope | Architectural layer | Status / decision | Mentioned in |
|---|---|---|---|---|---|---|
| Obsidian | Markdown knowledge base | Canonical knowledge-work surface and graph view | RAG/dev_graph | Knowledge surface | Core v1 | Chat; Current |
| Obsidian vault as Git repo | Architecture pattern | Versioned Markdown knowledge graph | RAG/dev_graph | Knowledge base | Core v1 | Chat |
| Obsidian graph view | Visualization | Visualize wiki/dev graph topology | RAG/dev_graph | Knowledge graph UX | Core v1 | Chat |
| Dataview | Obsidian plugin | Frontmatter queries, dashboards, admissibility filters | RAG/dev_graph | Metadata/query layer | Core v1 | Chat; Current |
| Smart Connections | Obsidian plugin/MCP | Semantic retrieval across vault/dev_graph | RAG/dev_graph | Semantic retrieval | Core v1 | Chat; Current |
| Smart Connections MCP | MCP server | Expose Obsidian semantic retrieval to agents | Claude Code; Hermes | MCP / retrieval | Core v1 | Chat; Current |
| MCP Vault / mcpvault | MCP server | Controlled read/write access to Obsidian vault notes | Claude Code; Hermes | MCP / filesystem | Core v1 | Chat; Current |
| Filesystem MCP | MCP server | Controlled local file/vault access | Claude Code; Hermes | MCP / filesystem | Core v1 | Chat |
| dev_graph | Ontology-governed engineering graph | Canonical implementation ontology, admissible context packs, constraints, gates, writeback | Claude Code; RAG | Semantic control layer | Core v1 | Current |
| Context7 / Context7 MCP | MCP server / docs retrieval | Retrieve current, version-specific API/library documentation for context packs | Claude Code; Hermes | MCP / API docs | Core v1 | Chat; Current |
| upstash/context7 | GitHub repo | Context7 MCP implementation | Claude Code; Hermes | MCP / API docs | Core v1 | Chat |
| API Documentation Policy | Governance policy | Permit only approved docs sources in coding context packs | dev_graph; Claude Code | Governance / docs | Core v1 | Current |
| Layer-3 Wiki | Project wiki / RAG substrate | Existing Obsidian/graph wiki for autonomous trading/project knowledge | RAG/dev_graph | Knowledge graph | Core v1 | Chat; Current |
| raw/ | Source layer | Immutable source documents | RAG/dev_graph | Source governance | Core v1 | Current |
| wiki/ | Synthesis knowledge base | Persistent domain synthesis; read-only from dev_graph sessions | RAG/dev_graph | Knowledge layer | Core v1 | Current |
| Context packs | Typed execution artifact | Assembled canonical nodes, constraints, code truth, docs, tests, acceptance criteria | Claude Code; dev_graph | Context assembly | Core v1 | Chat; Current |
| Neo4j | Graph database | Property graph storage, traversal, impact/traceability queries | RAG/dev_graph | Graph DB | Core v1 | Chat; Current |
| Neo4j MCP | MCP server | Graph inspection/querying from agents; read-only projection preferred | Claude Code; Hermes | MCP / graph | Core v1 | Chat; Current |
| Neo4j GraphRAG | GraphRAG library/pattern | Graph-native retrieval over Neo4j | RAG | GraphRAG | Core later / evaluate | Chat |
| neo4j/neo4j-graphrag-python | GitHub repo/library | Official Neo4j GraphRAG Python package | RAG | GraphRAG | Core later / evaluate | Chat |
| Neo4j GDS | Graph analytics library | Graph algorithms/analytics over Neo4j | RAG/dev_graph | Graph analytics | Core later | Chat |
| NetworkX | Python graph library | Local graph analytics and validation scripts | RAG/dev_graph | Graph analytics | Optional | Chat |
| SHACL | Constraint language | Validate ontology/graph constraints | RAG/dev_graph | Ontology validation | Core v1 | Chat |
| pySHACL / pyshacl | Python SHACL validator | Run SHACL validation after ontology edits | RAG/dev_graph | Ontology validation | Core v1 | Chat |
| RDF / OWL | Ontology standards | Formal ontology modelling layer | RAG/dev_graph | Ontology | Core later / use selectively | Chat |
| rdflib | Python RDF library | RDF/OWL utilities | RAG/dev_graph | Ontology tooling | Core later | Chat |
| owlready2 | Python OWL library | OWL ontology manipulation | RAG/dev_graph | Ontology tooling | Core later | Chat |
| Protégé | Ontology editor | Manual ontology design/review | RAG/dev_graph | Ontology tooling | Optional | Chat |
| ROBOT | Ontology toolkit | OWL ontology automation/validation | RAG/dev_graph | Ontology tooling | Optional | Chat |
| Pydantic v2 | Schema/contracts library | Typed contracts and JSON Schema generation | RAG; automation | Schemas | Core v1 | Chat |
| JSON Schema | Schema standard | Job manifests, result contracts, source manifests, ontology/eval contracts | Hermes; Claude Code; RAG | Schemas | Core v1 | Chat |
| YAML frontmatter | Markdown metadata format | Node metadata, Dataview filters, skill metadata | Obsidian; skills | Metadata | Core v1 | Chat; Video |
| Qdrant | Vector database | Dense/sparse/hybrid retrieval index | RAG | Vector retrieval | Core v1 | Chat |
| qdrant/qdrant | GitHub repo | Canonical Qdrant vector database | RAG | Vector retrieval | Core v1 | Chat |
| Qdrant hybrid search | Retrieval capability | Dense + sparse retrieval for terminology precision | RAG | Hybrid retrieval | Core v1 | Chat |
| Pinecone | Vector database | Possible external vector store mentioned in OS/dashboard context | RAG | Vector retrieval | Optional / not default | Video |
| Postgres / PostgreSQL | Database | Job state, manifests, eval tables; full-text keyword baseline | Hermes; RAG | State / retrieval | Core v1 | Chat |
| Postgres MCP | MCP server | Expose job/eval/manifests tables to agents | Hermes; Claude Code | MCP / DB | Core v1 with permissions | Chat; Current |
| SQLite | Embedded database | Session DB, simple job queue, local cost ledger | Hermes; RAG | Local persistence | Core v1 | Chat; Video |
| DuckDB | Embedded analytics DB | Deduplication, source manifests, data workbench | RAG; DevOps | Data workbench | Core v1 | Chat |
| OpenSearch | Search engine | Keyword/BM25 retrieval baseline | RAG | Keyword retrieval | Optional | Chat |
| Tantivy | Search engine library | Keyword/BM25 retrieval baseline | RAG | Keyword retrieval | Optional | Chat |
| BM25 / full-text baseline | Retrieval capability | Non-vector baseline for eval and hybrid retrieval | RAG | Retrieval | Core v1 | Chat |
| LlamaIndex / run-llama/llama_index | RAG framework | Ingestion, indexes, property graph retrieval, query engines | RAG | RAG framework | Core v1/evaluate | Chat |
| Haystack / deepset-ai/haystack | RAG framework | Production-style pipelines and component evaluation | RAG | RAG framework | Core later/evaluate | Chat |
| Microsoft GraphRAG | GraphRAG framework | Corpus-level community summaries/global sensemaking | RAG | GraphRAG | Optional / benchmark | Chat |
| DSPy | LLM programming/eval framework | Prompt/retriever optimisation after evals exist | RAG | Optimisation | Core later | Chat |
| LangGraph | Workflow/agent graph framework | Durable workflows, HITL, resumable orchestration under/alongside Hermes | Hermes; RAG | Workflow engine | Core later / evaluate | Chat |
| langchain-ai/langgraph | GitHub repo | Canonical LangGraph package | Hermes; RAG | Workflow engine | Core later | Chat |
| Marp | Markdown slide generator | Slide generation from wiki/content | Obsidian/RAG | Publishing | Optional | Chat |
| Custom Markdown parser/link linter | Script | Wiki link, orphan, frontmatter, stale-node checks | Obsidian/dev_graph | Validation | Core v1 | Chat |

## 5. Source Harvesting, Document Processing, Scientific Literature, and Media Tools
| Tool / Item | Type | Primary role / capability | Scope | Architectural layer | Status / decision | Mentioned in |
|---|---|---|---|---|---|---|
| Firecrawl | Web extraction/crawling tool | Search, scrape, crawl web sources | Hermes; RAG | Source harvesting | Core v1 or choose one web stack | Chat |
| firecrawl/firecrawl-mcp-server | MCP server repo | Expose Firecrawl to agents | Hermes; Claude Code | MCP / source harvesting | Core v1 candidate | Chat |
| Tavily | Web search/extraction provider | LLM-friendly web search/source acquisition | Hermes; RAG | Source harvesting | Optional / benchmark | Chat; Current |
| Brave Search | Search provider | Independent search index for web discovery | Hermes; RAG | Source harvesting | Optional / benchmark | Chat; Current |
| SearXNG | Self-hosted metasearch | Self-hosted search option | Hermes; RAG | Source harvesting | Optional / privacy | Chat |
| Exa | Neural/search API | Web discovery/source acquisition | Hermes; RAG | Source harvesting | Optional / benchmark | Chat |
| Jina Reader Search | Search/reader service | Return page content for web search results | Hermes; RAG | Source harvesting | Optional / benchmark | Current |
| Playwright | Browser automation framework | Browser tasks, UI tests, page interaction | Hermes; Claude Code | Browser automation | Core v1 for browser needs | Chat |
| Playwright MCP / microsoft/playwright-mcp | MCP server repo | Expose browser automation via MCP | Hermes; Claude Code | MCP / browser | Core v1 candidate | Chat |
| Browser MCP | MCP category | Browser automation/scraping/testing capability | Hermes; Claude Code | MCP / browser | Optional; avoid duplication | Chat |
| OpenAlex | Scholarly metadata API | Scientific literature discovery | RAG | Source harvesting | Optional / domain-specific | Chat |
| Crossref | Scholarly metadata API | DOI and bibliographic metadata | RAG | Source harvesting | Optional / domain-specific | Chat |
| Semantic Scholar | Scholarly search/API | Literature discovery and metadata | RAG | Source harvesting | Optional / domain-specific | Chat |
| Zotero | Reference manager | Scientific source management | RAG | Source management | Optional / useful | Chat |
| Better BibTeX | Zotero plugin | Stable citation keys and BibTeX export | RAG | Citation management | Optional / useful | Chat |
| Docling | Document conversion tool | PDF/DOC/HTML conversion to structured Markdown/text | RAG | Normalization | Core v1 candidate | Chat |
| Unstructured | Document parsing library | Parse heterogeneous documents | RAG | Normalization | Optional / benchmark | Chat |
| PyMuPDF | PDF library | PDF extraction/conversion | RAG | Normalization | Core v1 candidate | Chat |
| Marker | PDF/Markdown conversion tool | Document conversion to Markdown | RAG | Normalization | Optional / benchmark | Chat |
| pandoc | Document converter | Convert Markdown/DOCX/HTML/PDF-adjacent formats | RAG | Normalization / publishing | Core v1 | Chat |
| content hashes / checksums | Data-integrity technique | Deduplication, provenance, source and chunk versioning | RAG | Source governance | Core v1 | Chat |
| YAML / JSONL source manifests | Data format | Source records with URLs, checksums, provenance, extraction method | RAG | Source governance | Core v1 | Chat |
| Hyperframes | Video generation/editing tool | Hermes-controlled video generation/editing demo | Hermes | Creative/media automation | Optional | Video |
| Manim | Mathematical animation/video library | Creative/diagram/video generation skill demo | Hermes | Creative/media automation | Optional | Video |
| Excalidraw / Excal | Diagramming tool | Generate visual diagrams from Hermes skills | Hermes | Diagramming | Optional | Video |
| Vision analysis | Model/tool capability | Analyze generated video/image output quality | Hermes | Media verification | Optional | Video |
| Voice note / voice output | Messaging/media capability | Hermes can respond with text plus voice note in example | Hermes | Multimodal communication | Optional | Video |
| Transcription skill | Skill/capability | Speech/audio transcription capability mentioned as available/built-in-like | Hermes | Media processing | Optional | Video |

## 6. Evaluation, Benchmarking, Observability, Cost Control, and Reliability Harnesses
| Tool / Item | Type | Primary role / capability | Scope | Architectural layer | Status / decision | Mentioned in |
|---|---|---|---|---|---|---|
| Ragas / explodinggradients/ragas | RAG evaluation library | Evaluate retrieval, faithfulness, answer relevance, agentic RAG workflows | RAG/eval | Evaluation | Core v1 | Chat |
| DeepEval / confident-ai/deepeval | Evaluation framework | RAG metrics, custom evals, G-Eval-style judges | RAG/eval | Evaluation | Core v1 candidate | Chat |
| promptfoo / promptfoo/promptfoo | Prompt/model eval framework | Regression testing, red teaming, provider comparison, CI evals | RAG/eval; model routing | Evaluation | Core v1 | Chat |
| Arize Phoenix / arize-ai/phoenix | LLM observability | Trace retrieval, tool use, model calls, latency, cost, failures | Hermes; RAG | Tracing/observability | Core v1 | Chat |
| OpenTelemetry | Observability standard | Instrumentation for traces/metrics/logs | Hermes; RAG | Observability | Core later / useful | Chat |
| OpenInference | LLM tracing instrumentation | OTel-compatible LLM/RAG instrumentation | Hermes; RAG | Observability | Core later | Chat |
| LiteLLM / BerriAI/litellm | Model router/proxy/cost tracker | Multi-provider routing and spend tracking | Hermes; model routing | Cost/model routing | Core later after local harness | Chat |
| Custom SQLite/Postgres cost ledger | Internal ledger | Record token/cost/time per job/stage/model | Hermes; Claude Code | Cost control | Core v1 | Chat |
| Claude Code JSON cost metadata | Run metadata | Feed cost ledger from headless Claude runs | Claude Code | Cost control | Core v1 | Chat |
| Cost ceiling / max_cost_usd | Policy | Hard per-job budget limit | Hermes; Claude Code | Cost governance | Core v1 | Chat |
| Max turns | Policy | Limit runaway agent sessions | Hermes; Claude Code | Cost/reliability | Core v1 | Chat |
| Source harness | Reliability harness | Validate source ID, checksum, provenance, extraction, chunk count, rejection reason | RAG | Reliability | Core v1 | Chat |
| Ontology harness | Reliability harness | Schema/SHACL/duplicate/dangling relation/source-claim checks | RAG/dev_graph | Reliability | Core v1 | Chat |
| Wiki harness | Reliability harness | Frontmatter, unique IDs, links, orphans, Dataview/staleness checks | Obsidian/dev_graph | Reliability | Core v1 | Chat |
| Graph harness | Reliability harness | Neo4j constraints, node/edge counts, edge types, traversal fixtures | RAG/dev_graph | Reliability | Core v1 | Chat |
| Retrieval harness | Reliability harness | Golden questions, expected chunks, Recall@5, MRR, reranker/graph lift | RAG | Reliability | Core v1 | Chat |
| Answer harness | Reliability harness | Citation precision/recall, faithfulness, refusal correctness, hallucinated source IDs | RAG | Reliability | Core v1 | Chat |
| Agent harness | Reliability harness | Forbidden edits, secrets, tests, lint, cost, max turns, PR limitations | Claude Code | Reliability | Core v1 | Chat |
| Golden JSONL datasets | Eval data format | Regression cases and expected retrieval/answer behavior | RAG/eval | Evaluation data | Core v1 | Chat |
| DVC | Data/artifact versioning | Version datasets/eval artifacts | RAG/eval | Artifact versioning | Optional / useful | Chat |
| Git LFS | Large file storage | Store larger datasets/artifacts under Git | RAG/eval | Artifact versioning | Optional / useful | Chat |
| pytest snapshots | Testing pattern/tooling | Diff-based regression checks | Claude Code; RAG | Testing | Optional | Chat |
| approvaltests | Approval testing library | Snapshot/approval tests | Claude Code; RAG | Testing | Optional | Chat |
| Recall@k | Retrieval metric | Measure whether expected evidence appears in top-k | RAG/eval | Metric | Core v1 | Chat |
| MRR | Retrieval metric | Mean reciprocal rank of expected evidence | RAG/eval | Metric | Core v1 | Chat |
| NDCG | Retrieval metric | Ranked retrieval quality | RAG/eval | Metric | Optional | Chat |
| Hit rate | Retrieval metric | Whether retrieval hits target evidence | RAG/eval | Metric | Core v1 | Chat |
| Faithfulness | Answer metric | Whether answer is supported by retrieved context | RAG/eval | Metric | Core v1 | Chat |
| Citation correctness / citation precision/recall | Answer metric | Whether cited chunks support claims and all claims are cited | RAG/eval | Metric | Core v1 | Chat |
| Graph metrics | Graph health metrics | Orphan ratio, schema violations, duplicate entities, relation coverage | RAG/dev_graph | Metric | Core v1 | Chat |

## 7. DevOps, Infrastructure, Security, CI/CD, and Runtime Environment
| Tool / Item | Type | Primary role / capability | Scope | Architectural layer | Status / decision | Mentioned in |
|---|---|---|---|---|---|---|
| GitHub | Git hosting/platform | Repos, issues, PRs, Actions, code search, protected branches | All | SCM / collaboration | Core v1 | Chat; Video |
| GitHub MCP / github/github-mcp-server | MCP server repo | Repos, issues, PRs, code search from agents | Hermes; Claude Code | MCP / GitHub | Core v1 | Chat |
| modelcontextprotocol/servers | Reference MCP repo | Educational/reference MCP servers; require security review before production use | Hermes; Claude Code | MCP reference | Reference / guarded | Chat |
| MCP registries / community MCP bundles | Tool discovery source | Source of MCP candidates; risk of supply-chain/tool overload | Hermes; Claude Code | MCP ecosystem | Delay / guarded | Chat |
| mcp.json | MCP config file | Package MCP connections in Hermes profile/template repo | Hermes; Claude Code | MCP configuration | Core v1 | Chat |
| .claude/settings.json | Claude Code settings file | Permissions, hooks, MCP config, tool allowlists | Claude Code | Configuration | Core v1 | Chat |
| GitHub Actions | CI/CD | Run tests/evals/security checks; PR-based Claude automation | Claude Code; DevOps | CI/CD | Core v1 | Chat |
| Git worktrees | Git workflow | Isolated branches/workspaces for agent runs | Claude Code | Repo discipline | Core v1 | Chat |
| protected branches | GitHub policy | Prevent unsafe direct merges | DevOps | Safety | Core v1 | Chat |
| Git hooks | Git automation | Local checks before commits | DevOps | Safety / validation | Core v1 | Chat |
| pre-commit | Git hook framework | Run lint/security/checks before commit | DevOps | Validation | Core v1 | Chat |
| Docker | Container runtime | Run Hermes/agents/services in containers | Infra | Runtime | Core v1 | Chat; Video |
| Docker Compose | Container orchestration | Local Neo4j/Qdrant/Postgres/service stack | Infra | Runtime | Core v1 | Chat; Video |
| devcontainers | Dev environment standard | Reproducible development containers | Claude Code; DevOps | Environment | Optional / useful | Chat |
| uv | Python package/project manager | Fast Python env/project management | DevOps; Python | Environment | Core v1 | Chat |
| Makefile | Task runner | Canonical project commands | Claude Code; DevOps | Automation | Core v1 | Chat |
| just | Task runner | Alternative to Makefile | Claude Code; DevOps | Automation | Optional | Chat |
| pytest | Python test framework | Unit/integration/eval tests | Claude Code; RAG | Testing | Core v1 | Chat |
| vitest | JS/TS test framework | Frontend/TypeScript tests | Claude Code | Testing | Core v1 if JS/TS | Chat |
| Ruff | Python linter/formatter | Fast lint/format enforcement | Claude Code; DevOps | Lint/format | Core v1 | Chat |
| Black | Python formatter | Python code formatting | Claude Code; DevOps | Formatting | Optional if using Ruff formatter | Chat |
| Prettier | Formatter | JS/TS/Markdown formatting | Claude Code; DevOps | Formatting | Core v1 if JS/MD | Chat |
| ESLint | JS/TS linter | JS/TS linting | Claude Code; DevOps | Linting | Core v1 if JS/TS | Chat |
| mypy | Python type checker | Python static typing checks | Claude Code; DevOps | Typecheck | Core v1 candidate | Chat |
| Pyright | Python type checker / LSP | Python static typing and code intelligence | Claude Code; IDE | Typecheck / LSP | Core v1 candidate | Chat |
| Python LSP | LSP capability | Python symbol navigation/type/error context for agents | Claude Code; IDE | Code intelligence | Core later | Chat |
| TypeScript LSP | LSP capability | TypeScript symbol navigation/type/error context for agents | Claude Code; IDE | Code intelligence | Core later | Chat |
| Gitleaks | Secrets scanner | Detect secrets in diffs/repos | DevOps; security | Security | Core v1 | Chat |
| TruffleHog | Secrets scanner | Detect secrets in git history/files | DevOps; security | Security | Core v1 candidate | Chat |
| pip-audit | Python dependency scanner | Python dependency vulnerabilities | DevOps; security | Security | Core v1 | Chat |
| npm audit | Node dependency scanner | Node dependency vulnerabilities | DevOps; security | Security | Core v1 if JS | Chat |
| OSV-Scanner | Dependency vulnerability scanner | Open Source Vulnerabilities database scanner | DevOps; security | Security | Core v1 candidate | Chat |
| Trivy | Container/SBOM/vulnerability scanner | Container/dependency scanning | DevOps; security | Security | Core v1 | Chat |
| Grype | Container/SBOM scanner | Container/image vulnerability scanning | DevOps; security | Security | Optional | Chat |
| Semgrep | Static analysis/security | Custom code/security rules | DevOps; security | Security | Core v1 | Chat |
| Bandit | Python security linter | Python security static analysis | DevOps; security | Security | Core v1 candidate | Chat |
| MinIO | Local object store | Local S3-compatible object storage for large corpora | RAG; Infra | Storage | Optional | Chat |
| Dramatiq | Python task queue | Background job queue alternative | Hermes/backend | Queue | Optional | Chat |
| Celery | Task queue | Background job queue alternative | Hermes/backend | Queue | Optional | Chat |
| Redis Queue / RQ | Task queue | Background job queue alternative | Hermes/backend | Queue | Optional | Chat |
| Prefect | Workflow orchestration | Data/workflow orchestration alternative | Hermes/backend | Workflow engine | Optional | Chat |
| Dagster | Workflow orchestration | Data/workflow orchestration alternative | Hermes/backend | Workflow engine | Optional | Chat |
| Temporal | Durable workflow engine | Durable, retryable, auditable workflows | Hermes/backend | Workflow engine | Optional / strong later | Chat |
| Modal | Cloud compute/workflow deployment | Run workflow/script tasks without full agent loop | Hermes/backend | Compute | Optional | Video |
| VPS | Cloud server | Always-on Hermes/OpenClaw/Claude infrastructure | Hermes | Infrastructure | Core v1 or local alternative | Video |
| Hostinger | VPS provider | Example VPS provider/one-click Hermes deployment | Hermes | Infrastructure | Optional vendor | Video |
| KVM 1/2/4/8 | VPS plan type | Compute/RAM/bandwidth tiering in Hostinger example | Hermes | Infrastructure | Reference | Video |
| Ubuntu 24.04 LTS | Operating system | Example server OS for Hermes VPS | Hermes; Infra | OS | Core if VPS Linux | Video |
| SystemD | Linux service manager | Run Hermes gateways/services in background | Hermes; Infra | Service management | Core if VPS Linux | Video |
| Termux | Android Linux environment | Run Hermes on Android according to extract | Hermes | Runtime option | Optional | Video |
| Mac Mini | Local always-on hardware | Possible Hermes host | Hermes | Infrastructure | Optional | Video |
| MacBook / laptop | Local host | Run Hermes locally with local tools/context | Hermes | Infrastructure | Optional | Video |
| n8n | Workflow automation | Mentioned as VPS-hosted automation/open agent infrastructure in extract | Hermes/backend | Automation | Optional | Video |
| AWS Bedrock | Managed model platform | Claude/provider backend option and secure model routing candidate | Model/infra | LLM hosting | Optional / enterprise | Chat; Current |
| AWS PrivateLink | Private network connectivity | Private Bedrock/service access in AWS security design | Infra/security | Network security | Optional / enterprise | Current |
| AWS VPC | Cloud network | Private cloud network for secure orchestrator/model calls | Infra/security | Network | Optional / enterprise | Current |
| AWS IAM | Identity/access management | Role-based access without raw API keys | Infra/security | Security | Optional / enterprise | Current |
| AWS Secrets Manager | Secret storage | Store API/config secrets | Infra/security | Secrets | Optional / enterprise | Current |
| AWS KMS | Key management | Encrypt stored data/secrets/artifacts | Infra/security | Encryption | Optional / enterprise | Current |
| AWS CloudTrail | Audit logging | Audit AWS/Bedrock calls | Infra/security | Audit | Optional / enterprise | Current |
| AWS CloudWatch | Monitoring/logging | Monitor infrastructure and LLM activity | Infra/security | Observability | Optional / enterprise | Current |
| Google Vertex AI | Managed model platform | Alternative Claude/model hosting/authentication option | Model/infra | LLM hosting | Optional / enterprise | Chat |

## 8. Models, Providers, Routers, Embeddings, and Rerankers
| Tool / Item | Type | Primary role / capability | Scope | Architectural layer | Status / decision | Mentioned in |
|---|---|---|---|---|---|---|
| Anthropic | Model provider | Claude models for coding/reasoning/audits | Claude Code; Hermes | Provider | Core via Claude Code | Chat |
| Claude | Model family | Reasoning, coding, review, architecture | Claude Code; Hermes | LLM | Core v1 | Chat; Video |
| Claude Haiku-class | Model tier | Cheap/fast tasks where supported | Claude Code; Hermes | Model routing | Optional / route by task | Chat |
| Claude Sonnet-class | Model tier | Default implementation/review balance | Claude Code | Model routing | Core v1 | Chat |
| Sonnet 4.6 | Model example | Middle-ground performance/cost option in video extract | Hermes; Claude Code | Model routing | Reference / evaluate | Video |
| Claude Opus-class | Model tier | Final critical audits/architecture review | Claude Code; Hermes | Model routing | Selective use | Chat |
| Opus 4.8 | Model example | Strong but expensive model in video extract | Hermes; Claude Code | Model routing | Selective / expensive | Video |
| OpenAI | Model provider | Hermes backend, embeddings, GPT models | Hermes; RAG | Provider | Core/optional | Chat; Video |
| ChatGPT subscription | Subscription route | Use existing subscription as Hermes brain in examples | Hermes | Provider/auth | Optional | Video |
| GPT-5.5 | Model example | Hermes brain/model choice in video extract | Hermes | LLM | Evaluate | Video |
| GPT-mini-class | Model tier | Cheap classification/extraction tasks | Hermes | Model routing | Optional / cheap tier | Chat |
| OpenAI embeddings | Embedding model family | Managed embedding candidate | RAG | Embeddings | Benchmark | Chat |
| Grok | Model/provider | Hermes provider via OAuth/subscription; access to X signals in extract | Hermes | Provider/model | Optional | Video |
| Gemini | Model family/provider | Alternative model/tool surface in visual OS examples | Hermes; RAG | Provider/model | Optional / benchmark | Video |
| OpenRouter | Model router/provider | Access many models; cost/performance routing | Hermes; Claude Code | Model routing | Core later or immediate if needed | Chat; Video |
| LM Studio | Local model runtime | Run local models as Hermes backend | Hermes | Local model runtime | Optional / privacy | Video |
| Qwen | Open model family | Local/open-source model candidate; embeddings also candidate | Hermes; RAG | Model/embedding | Optional / benchmark | Chat; Video |
| Llama | Open model family | Local/open-source model candidate | Hermes | Model | Optional / benchmark | Chat; Video |
| DeepSeek V4 Flash | Model example | Cheap/free model option in video extract | Hermes | Model routing | Optional / benchmark | Video |
| Mistral | Model provider/family | Low-cost model candidates | Hermes | Model routing | Optional / benchmark | Chat |
| Devstral | Mistral coding model | Low-cost coding candidate | Hermes; coding | Model routing | Optional / benchmark | Chat |
| Codestral | Mistral coding model | Low-cost coding candidate | Hermes; coding | Model routing | Optional / benchmark | Chat |
| Ministral | Mistral small model | Cheap classification/extraction candidate | Hermes | Model routing | Optional / benchmark | Chat |
| Voyage embeddings | Embedding model | Managed embedding candidate | RAG | Embeddings | Benchmark | Chat |
| Voyage reranker | Reranker | Rerank retrieved chunks | RAG | Reranking | Benchmark | Chat |
| Cohere reranker | Reranker | Rerank retrieved chunks | RAG | Reranking | Benchmark | Chat |
| Jina embeddings | Embedding model | Managed embedding candidate | RAG | Embeddings | Benchmark | Chat |
| Jina reranker | Reranker | Rerank retrieved chunks | RAG | Reranking | Benchmark | Chat |
| BGE-M3 | Embedding model | Local/multilingual dense/sparse embedding candidate | RAG | Embeddings | Benchmark | Chat |
| E5 | Embedding model family | Local/open embedding candidate | RAG | Embeddings | Benchmark | Chat |
| Qwen embeddings | Embedding model family | Embedding candidate | RAG | Embeddings | Benchmark | Chat |
| local cross-encoder | Reranking model type | Local reranker candidate | RAG | Reranking | Benchmark | Chat |
| local endpoint / custom endpoint | Model serving route | Use custom or local OpenAI-compatible models | Hermes; RAG | Model routing | Optional / privacy | Chat |
| OAuth provider connections | Auth method | Connect subscription-backed models such as Grok/OpenAI in video examples | Hermes | Authentication | Optional | Video |

## 9. Proposed Internal Repositories, Templates, Blueprints, and Command Interfaces
| Tool / Item | Type | Primary role / capability | Scope | Architectural layer | Status / decision | Mentioned in |
|---|---|---|---|---|---|---|
| rag-factory-profile | Proposed Hermes profile repo | Hermes distribution with SOUL, config, MCP, skills, cron jobs | Hermes | Internal repo | Build v1 | Chat |
| distribution.yaml | Hermes profile file | Define a shareable Hermes profile distribution | Hermes | Packaging | Build v1 | Chat |
| config.yaml | Hermes/profile config | Store profile-level configuration and defaults | Hermes | Configuration | Build v1 | Chat |
| ontology-rag-template | Proposed template repo | Reusable ontology-RAG project skeleton for Claude Code | Claude Code; RAG | Internal repo | Build v1 | Chat |
| rag-eval-harness | Proposed eval repo | Independent RAG/graph/cost/test evaluation package | RAG/eval | Internal repo | Build v1 | Chat |
| rag-blueprints | Proposed blueprint repo | Reusable blueprints: Karpathy wiki, ontology-first GraphRAG, literature RAG, etc. | Hermes; RAG | Internal repo | Build v1 | Chat |
| claude-rag-factory | Proposed repo | Claude Code-first RAG factory with skills, agents, scripts, evals, Compose | Claude Code; RAG | Internal repo | Build v1 | Chat |
| karpathy_llm_wiki blueprint | Blueprint | Markdown/Obsidian/Git-backed LLM wiki pattern | RAG/Obsidian | Blueprint | Core v1 | Chat; Current |
| ontology-first-rag blueprint | Blueprint | RAG where ontology controls classes/relations/constraints/retrieval | RAG/dev_graph | Blueprint | Core v1 | Chat |
| graph-rag blueprint | Blueprint | GraphRAG project pattern | RAG/dev_graph | Blueprint | Core later | Chat |
| scientific-literature-rag blueprint | Blueprint | Scholarly source ingestion and literature review RAG | RAG | Blueprint | Optional / domain-specific | Chat |
| proposal-consortium-rag blueprint | Blueprint | Proposal/partner/consortium knowledge RAG | RAG | Blueprint | Core for user domain | Chat |
| codebase-wiki-rag blueprint | Blueprint | Codebase documentation/wiki RAG | Claude Code; RAG | Blueprint | Core later | Chat |
| PDRs | Design records | Preliminary design records for major architecture choices | Governance | Design control | Core v1 | Current |
| ADRs | Architecture decision records | Record accepted architecture decisions and consequences | Governance | Design control | Core v1 | Chat; Current |
| job manifest | Structured job file | Bridge Hermes to Claude Code with scope, outputs, gates, budget | Hermes; Claude Code | Automation contract | Core v1 | Chat |
| source_manifest.schema.json | Schema file | Validate source manifests | RAG | Schema | Build v1 | Chat |
| ontology.schema.json | Schema file | Validate ontology structure | RAG | Schema | Build v1 | Chat |
| rag_job.schema.json | Schema file | Validate Hermes/Claude RAG job manifests | Hermes; RAG | Schema | Build v1 | Chat |
| eval_result.schema.json | Schema file | Validate evaluation outputs | RAG/eval | Schema | Build v1 | Chat |
| source_manifest.py | Script | Build/check source manifests | RAG | Script | Build v1 | Chat |
| frontmatter_lint.py | Script | Validate Obsidian/dev_graph frontmatter | RAG/dev_graph | Script | Build v1 | Chat |
| graph_health.py | Script | Orphan/stale/link/schema graph health checks | RAG/dev_graph | Script | Build v1 | Chat |
| shacl_validate.py | Script | Run SHACL validation | RAG/dev_graph | Script | Build v1 | Chat |
| cost_report.py | Script | Generate cost reports | Hermes; eval | Script | Build v1 | Chat |
| hermes rag new | Command interface | Create new ontology-RAG project | Hermes | CLI / OS command | Target interface | Chat |
| hermes rag audit | Command interface | Run grill/eval/graph-health/cost report | Hermes | CLI / OS command | Target interface | Chat |
| hermes rag refresh | Command interface | Refresh project with new sources and possibly open PR | Hermes | CLI / OS command | Target interface | Chat |
| hermes claude spawn | Command interface | Spawn Claude Code job from typed manifest | Hermes; Claude Code | CLI / OS command | Target interface | Chat |
| /rag-new | Hermes command concept | Create new RAG project | Hermes | Command | Target interface | Chat |
| /rag-refresh | Hermes command concept | Refresh an existing RAG project | Hermes | Command | Target interface | Chat |
| /rag-audit | Hermes command concept | Audit RAG project, grill, eval, cost report | Hermes | Command | Target interface | Chat |
| /ontology-rag-build | Claude Code skill | Build ontology-grounded RAG | Claude Code | Skill | Build v1 | Chat |
| /ontology-rag-refresh | Claude Code skill | Refresh ontology-RAG project | Claude Code | Skill | Build v1 | Chat |
| /wiki-node-audit | Claude Code skill | Audit wiki nodes | Claude Code; Obsidian | Skill | Build v1 | Chat |
| /frontmatter-lint-fix | Claude Code skill | Fix frontmatter schema issues | Claude Code; Obsidian | Skill | Build v1 | Chat |
| /neo4j-schema-sync | Claude Code skill | Apply/sync Neo4j constraints/indexes/projection | Claude Code; RAG | Skill | Build v1 | Chat |
| /qdrant-reindex | Claude Code skill | Rebuild vector/hybrid index | Claude Code; RAG | Skill | Build v1 | Chat |
| /rag-eval | Claude Code skill | Run RAG evaluation | Claude Code; RAG | Skill | Build v1 | Chat |
| /grill-rag-design | Claude/Hermes skill | Stress-test RAG design | Hermes; Claude Code | Skill | Build v1 | Chat |
| /source-manifest-audit | Claude/Hermes skill | Audit source manifest quality/provenance | Hermes; Claude Code | Skill | Build v1 | Chat |
| /graph-health-report | Claude/Hermes skill | Produce graph health report | Hermes; Claude Code | Skill | Build v1 | Chat |
| /repo-hunter | Claude Code skill | Find candidate repos for a capability | Claude Code; DevOps | Skill | Build v1 | Chat |
| /repo-triage | Claude Code skill | Assess repo activity/license/security/API fit | Claude Code; DevOps | Skill | Build v1 | Chat |
| /integration-plan | Claude Code skill | Choose wrapper/fork/dependency/MCP integration | Claude Code; DevOps | Skill | Build v1 | Chat |
| /mcp-candidate-audit | Claude Code skill | Review MCP risk before enabling | Claude Code; DevOps | Skill | Build v1 | Chat |
| /dockerize-service | Claude Code skill | Add reproducible Compose service | Claude Code; DevOps | Skill | Optional | Chat |
| /ci-gate-add | Claude Code skill | Add GitHub Actions gate | Claude Code; DevOps | Skill | Build v1 | Chat |
| /release-notes | Claude Code skill | Summarize changes and migrations | Claude Code | Skill | Optional | Chat |

## 10. Named Claude Code Skills, Subagents, and Governance Roles
| Tool / Item | Type | Primary role / capability | Scope | Architectural layer | Status / decision | Mentioned in |
|---|---|---|---|---|---|---|
| ponytail-diff | Skill | Minimum viable diff, reuse-first, no unnecessary abstractions | Claude Code | Coding discipline | Build v1 | Chat |
| root-cause-fix | Skill | Fix underlying defect rather than visible symptom | Claude Code | Coding discipline | Build v1 | Chat |
| repo-map | Skill | Build/update repo map before coding | Claude Code | Codebase understanding | Build v1 | Chat |
| dependency-justification | Skill/gate | Require justification before adding dependency | Claude Code | Dependency governance | Build v1 | Chat |
| refactor-with-gates | Skill | Refactor only with baseline tests and rollback plan | Claude Code | Refactoring governance | Build v1 | Chat |
| delete-dead-code | Skill | Remove unused code safely | Claude Code | Maintenance | Optional | Chat |
| rag-blueprint-new | Skill | Create new ontology-RAG skeleton | Claude Code | RAG factory | Build v1 | Chat |
| source-manifest-build | Skill | Normalize source inventory | Hermes; Claude Code | RAG source pipeline | Build v1 | Chat |
| source-harvest-audit | Skill | Check provenance, checksums, extraction quality | Hermes; Claude Code | RAG source pipeline | Build v1 | Chat |
| ontology-draft | Skill | Draft classes, relations, constraints | Claude Code; RAG | Ontology | Build v1 | Chat |
| ontology-shacl-check | Skill | Validate ontology with SHACL | Claude Code; RAG | Ontology validation | Build v1 | Chat |
| obsidian-node-generate | Skill | Generate Markdown nodes with YAML | Claude Code; Obsidian | Wiki generation | Build v1 | Chat |
| obsidian-graph-health | Skill | Check orphan links, stale nodes, bad frontmatter | Claude Code; Obsidian | Graph health | Build v1 | Chat |
| qdrant-reindex | Skill | Rebuild vector/hybrid index | Claude Code; RAG | Retrieval | Build v1 | Chat |
| rag-eval-run | Skill | Run retrieval and answer evals | Claude Code; RAG | Evaluation | Build v1 | Chat |
| rag-eval-interpret | Skill | Explain metrics and failure modes | Claude Code; RAG | Evaluation | Build v1 | Chat |
| citation-audit | Skill | Check whether cited chunks support claims | Claude Code; RAG | Evaluation | Build v1 | Chat |
| grill-requirements | Skill | Challenge unclear requirements | Hermes; Claude Code | Design gate | Build v1 | Chat |
| grill-ontology | Skill | Challenge entity/relation choices | Hermes; Claude Code | Design gate | Build v1 | Chat |
| grill-devops | Skill | Challenge deployment/security assumptions | Hermes; Claude Code | Design gate | Build v1 | Chat |
| grill-cost | Skill | Challenge whether tool/model choice is cost-efficient | Hermes; Claude Code | Design gate | Build v1 | Chat |
| graph-writeback | Skill | Stage semantic graph updates after implementation | Claude Code; dev_graph | Graph governance | Build v1 | Current |
| repo-archaeologist | Subagent | Understand repo structure before changes | Claude Code | Subagent | Build v1 | Chat |
| minimal-diff-engineer | Subagent | Implement Ponytail-style patches | Claude Code | Subagent | Build v1 | Chat |
| test-engineer | Subagent | Add/repair tests | Claude Code | Subagent | Build v1 | Chat |
| devops-engineer | Subagent | Docker, CI, task runners | Claude Code | Subagent | Build v1 | Chat |
| security-auditor | Subagent | Secrets, unsafe commands, dependency risk | Claude Code | Subagent | Build v1 | Chat |
| mcp-auditor | Subagent | Review MCP servers before enabling | Claude Code | Subagent | Build v1 | Chat |
| ontology-architect | Subagent | Graph schema, SHACL, concept model | Claude Code; RAG | Subagent | Build v1 | Chat |
| source-curator | Subagent | Check manifests, source quality, duplicates | Claude Code; RAG | Subagent | Build v1 | Chat |
| ingestion-engineer | Subagent | Implement parsers, chunking, metadata | Claude Code; RAG | Subagent | Build v1 | Chat |
| retrieval-engineer | Subagent | Chunking, embeddings, hybrid retrieval, reranking | Claude Code; RAG | Subagent | Build v1 | Chat |
| eval-engineer | Subagent | Golden sets, RAGAS/DeepEval/promptfoo tests | Claude Code; RAG | Subagent | Build v1 | Chat |
| obsidian-librarian | Subagent | YAML, links, Dataview, graph health | Claude Code; Obsidian | Subagent | Build v1 | Chat |
| cost-auditor | Subagent | Token/cost reports and budget checks | Claude Code; Hermes | Subagent | Build v1 | Chat |


## 11. External Repos / Packages Mentioned — Quick Index

| Repo / package | Category | Recommended disposition |
|---|---|---|
| `NousResearch/hermes-agent` | Hermes runtime | Core v1 |
| `anthropics/claude-code-action` | Claude Code GitHub integration | Core v1 |
| `cobusgreyling/loop-engineering` | Loop methodology/scaffold | Core concept / integrate |
| `colbymchenry/codegraph` | Code topology MCP/index | Adapter; integrate, not replace dev_graph |
| `mattpocock/skills` | Skill patterns including Grill Me | Skill inspiration / adapt |
| `DietrichGebert/ponytail` | Coding discipline | Convert to Claude Code skill/rule |
| `bytedance/deer-flow` | Agent harness | Optional benchmark/later sidecar |
| `upstash/context7` | Current docs MCP | Core v1 candidate |
| `github/github-mcp-server` | GitHub MCP | Core v1 |
| `microsoft/playwright-mcp` | Browser MCP | Core v1 candidate |
| `firecrawl/firecrawl-mcp-server` | Web extraction MCP | Core v1 candidate if Firecrawl chosen |
| `neo4j/neo4j-graphrag-python` | GraphRAG library | Evaluate/core later |
| `qdrant/qdrant` | Vector DB | Core v1 |
| `run-llama/llama_index` | RAG framework | Evaluate/core v1 |
| `deepset-ai/haystack` | RAG framework | Evaluate/core later |
| `explodinggradients/ragas` | RAG evaluation | Core v1 |
| `confident-ai/deepeval` | RAG/custom evaluation | Core v1 candidate |
| `promptfoo/promptfoo` | Prompt/model regression | Core v1 |
| `arize-ai/phoenix` | Observability/tracing | Core v1 |
| `BerriAI/litellm` | Model routing/cost tracking | Core later |
| `langchain-ai/langgraph` | Durable workflow graphs | Core later / evaluate |
| OpenHands | Agent harness | Optional benchmark |
| OpenCode / opencode | Coding agent | Optional benchmark |
| Codex CLI | Coding CLI | Optional benchmark |
