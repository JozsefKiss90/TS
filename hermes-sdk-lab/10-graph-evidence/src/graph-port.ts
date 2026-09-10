/**
 * The PORT — Hermes's side of the knowledge-graph boundary (lesson 0014).
 *
 * Lesson 0006 put a port between the loop and the model provider. This is
 * the same move at the evidence boundary. Everything here is Hermes's
 * vocabulary: an item, a bundle, a query. No file path, no Python, no
 * `canonical_id`, no snake_case. The adapter below the port translates,
 * and the domain never learns the export's spellings.
 *
 * An interface is erased at compile time (lesson 0001). The runtime guard
 * is the adapter's parse of whatever bytes it reads, plus the MCP server's
 * parse of whatever it returns.
 */
import type { EvidenceBundle, EvidenceItem } from "./evidence.js";

export interface KnowledgeGraph {
  /**
   * Every item whose id, slug or title contains `query`, at most `limit`.
   * A miss is an empty bundle, never a throw: "not in the graph" is an
   * answer the loop must be able to read.
   */
  search(query: string, limit: number): Promise<EvidenceBundle>;
  /** One item by the graph's canonical id, or undefined. */
  node(id: string): Promise<EvidenceItem | undefined>;
  /** Every item, for a client that lists the graph instead of querying it. */
  all(): Promise<EvidenceItem[]>;
}
