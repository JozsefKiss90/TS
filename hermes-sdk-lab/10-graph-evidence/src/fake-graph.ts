/**
 * The FAKE — a KnowledgeGraph that answers from a list it was handed
 * (lesson 0015).
 *
 * Same move as lesson 0006's FakeModelGateway, one port over. It honours
 * the whole `KnowledgeGraph` interface, reads no file, translates nothing,
 * and records every query so a test can assert what the server asked for.
 *
 * Two things a fake does NOT do, on purpose:
 *
 *   1. It does not parse its items. The constructor takes `EvidenceItem[]`,
 *      already typed. A test may hand it an item the schema would refuse,
 *      such as `confirmed` on one source, and see which guard catches it.
 *      That guard is the server's output parse, not the fake.
 *   2. It does not know dev_graph's spellings. `slug` and `title` live in
 *      the export row, which a fake never sees, so search matches on the
 *      item's id and claim instead.
 */
import type { EvidenceBundle, EvidenceItem } from "./evidence.js";
import type { KnowledgeGraph } from "./graph-port.js";

/** ISO timestamp supplier, as in the export adapter. Fixed by default,
 * because a fake's job is to be predictable. */
export type Clock = () => string;
export const FAKE_CLOCK: Clock = () => "2026-09-20T09:00:00.000Z";

export class FakeKnowledgeGraph implements KnowledgeGraph {
  static readonly NAME = "FakeKnowledgeGraph";
  /** Every query the server sent, in order. */
  readonly queries: string[] = [];

  constructor(
    private readonly items: EvidenceItem[],
    private readonly snapshot = "fake-snapshot",
    private readonly clock: Clock = FAKE_CLOCK,
  ) {}

  async search(query: string, limit: number): Promise<EvidenceBundle> {
    this.queries.push(query);
    const needle = query.toLowerCase();
    const items = this.items
      .filter((i) => i.id.toLowerCase().includes(needle) || i.claim.toLowerCase().includes(needle))
      .slice(0, limit);
    return {
      query,
      assembledAt: this.clock(),
      assembledBy: { adapter: FakeKnowledgeGraph.NAME, snapshot: this.snapshot },
      items,
    };
  }

  async node(id: string): Promise<EvidenceItem | undefined> {
    return this.items.find((i) => i.id === id);
  }

  async all(): Promise<EvidenceItem[]> {
    return [...this.items];
  }
}
