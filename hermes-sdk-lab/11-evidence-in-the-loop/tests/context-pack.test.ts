/**
 * The Context Pack's rules, written before the schema that enforces them
 * (lesson 0016). Four of them are the pack's own, and one belongs to the
 * evidence schema of lesson 0014 and travels here because the pack nests it.
 */
import { describe, expect, it } from "vitest";
import type { EvidenceBundle } from "../../10-graph-evidence/src/evidence.js";
import { item } from "../../10-graph-evidence/tests/helpers.js";
import {
  admitContextPack,
  assembleContextPack,
  packForDispatch,
  renderPack,
  type EvidencePort,
} from "../src/context-pack.js";
import { spec } from "./helpers.js";

const queryRow = (query: string, snapshot = "snap-1", matched = 1) => ({
  query,
  adapter: "TestGraph",
  snapshot,
  assembledAt: "2026-09-30T09:00:00.000Z",
  matched,
});

describe("the pack's admissibility rules", () => {
  it("admits a pack with one query and two items", () => {
    const admission = admitContextPack({
      job: "Audit the atlas graph",
      assembledFrom: [queryRow("supervisor", "snap-1", 2)],
      items: [item("MOD-004", "Job supervisor loop is implemented (module)."), item("MOD-006", "JSON Lines trace is implemented (module).")],
    });
    expect(admission.admitted).toBe(true);
    if (!admission.admitted) return;
    expect(admission.pack.items).toHaveLength(2);
  });

  it("refuses a pack with no items — no pack, no dispatch", () => {
    const admission = admitContextPack({
      job: "Audit the atlas graph",
      assembledFrom: [queryRow("kubernetes", "snap-1", 0)],
      items: [],
    });
    expect(admission.admitted).toBe(false);
    if (admission.admitted) return;
    expect(admission.rejections.join(" ")).toContain("items");
  });

  it("refuses a pack assembled from two snapshots", () => {
    const admission = admitContextPack({
      job: "Audit the atlas graph",
      assembledFrom: [queryRow("supervisor", "snap-1"), queryRow("trace", "snap-2")],
      items: [item("MOD-004", "Job supervisor loop is implemented (module).")],
    });
    expect(admission.admitted).toBe(false);
    if (admission.admitted) return;
    expect(admission.rejections.join(" ")).toContain("one snapshot");
  });

  it("refuses a pack that cites the same id twice", () => {
    const admission = admitContextPack({
      job: "Audit the atlas graph",
      assembledFrom: [queryRow("supervisor"), queryRow("loop")],
      items: [
        item("MOD-004", "Job supervisor loop is implemented (module)."),
        item("MOD-004", "Job supervisor loop is implemented (module)."),
      ],
    });
    expect(admission.admitted).toBe(false);
    if (admission.admitted) return;
    expect(admission.rejections.join(" ")).toContain("once");
  });

  it("runs the evidence schema's own refinement on every item", () => {
    const overclaimed = item("MOD-003", "FakeModelGateway is implemented (module).", "confirmed");
    const admission = admitContextPack({
      job: "Audit the atlas graph",
      assembledFrom: [queryRow("fake")],
      items: [overclaimed],
    });
    expect(admission.admitted).toBe(false);
    if (admission.admitted) return;
    expect(admission.rejections.join(" ")).toContain("confirmed needs at least two sources");
  });
});

describe("assembly over the port", () => {
  const bundle = (query: string, items: EvidenceBundle["items"]): EvidenceBundle => ({
    query,
    assembledAt: "2026-09-30T09:00:00.000Z",
    assembledBy: { adapter: "TestGraph", snapshot: "snap-1" },
    items,
  });

  class ScriptedGraph implements EvidencePort {
    readonly asked: Array<{ query: string; limit: number }> = [];
    constructor(private readonly answers: Record<string, EvidenceBundle["items"]>) {}
    async search(query: string, limit: number): Promise<EvidenceBundle> {
      this.asked.push({ query, limit });
      return bundle(query, (this.answers[query] ?? []).slice(0, limit));
    }
  }

  it("asks one query per spec entry, at the spec's limit", async () => {
    const supervisor = item("MOD-004", "Job supervisor loop is implemented (module).");
    const trace = item("MOD-006", "JSON Lines trace is implemented (module).");
    const graph = new ScriptedGraph({ supervisor: [supervisor], trace: [trace] });

    const admission = await assembleContextPack(
      graph,
      spec({ evidenceQueries: ["supervisor", "trace"], evidenceLimit: 3 }),
    );

    expect(graph.asked).toEqual([
      { query: "supervisor", limit: 3 },
      { query: "trace", limit: 3 },
    ]);
    expect(admission.admitted).toBe(true);
    if (!admission.admitted) return;
    expect(admission.pack.items.map((i) => i.id)).toEqual(["MOD-004", "MOD-006"]);
    expect(admission.pack.assembledFrom.map((s) => s.matched)).toEqual([1, 1]);
  });

  it("keeps an item once when two queries both match it", async () => {
    const shared = item("MOD-004", "Job supervisor loop is implemented (module).");
    const graph = new ScriptedGraph({ supervisor: [shared], loop: [shared] });

    const admission = await assembleContextPack(
      graph,
      spec({ evidenceQueries: ["supervisor", "loop"] }),
    );

    expect(admission.admitted).toBe(true);
    if (!admission.admitted) return;
    expect(admission.pack.items).toHaveLength(1);
    // The second query still shows what it matched, so the record does not
    // pretend the question went unasked.
    expect(admission.pack.assembledFrom.map((s) => s.matched)).toEqual([1, 1]);
  });

  it("turns a port failure into a rejection that names the query", async () => {
    const broken: EvidencePort = {
      async search(query) {
        throw new Error(`transport closed while asking "${query}"`);
      },
    };

    const admission = await assembleContextPack(broken, spec({ evidenceQueries: ["supervisor"] }));

    expect(admission.admitted).toBe(false);
    if (admission.admitted) return;
    expect(admission.rejections.join(" ")).toContain("supervisor");
    expect(admission.rejections.join(" ")).toContain("transport closed");
  });

  it("refuses a job whose queries match nothing", async () => {
    const graph = new ScriptedGraph({});
    const admission = await assembleContextPack(graph, spec({ evidenceQueries: ["kubernetes"] }));
    expect(admission.admitted).toBe(false);
  });
});

describe("what the loop is handed", () => {
  const admitted = () => {
    const admission = admitContextPack({
      job: "Audit the atlas graph",
      assembledFrom: [queryRow("supervisor", "snap-1", 1), queryRow("trace", "snap-1", 1)],
      items: [
        item("MOD-004", "Job supervisor loop is implemented (module)."),
        item("MOD-006", "JSON Lines trace is implemented (module)."),
      ],
    });
    if (!admission.admitted) throw new Error(admission.rejections.join("; "));
    return admission.pack;
  };

  it("renders every id, its claim and its confidence", () => {
    const text = renderPack(admitted());
    expect(text).toContain("MOD-004");
    expect(text).toContain("Job supervisor loop is implemented (module).");
    expect(text).toContain("single-source");
    expect(text).toContain("snap-1");
  });

  it("hands the supervisor text plus a reference, and nothing else", () => {
    const pack = packForDispatch(admitted());
    expect(pack.ids).toEqual(["MOD-004", "MOD-006"]);
    expect(pack.queries).toEqual(["supervisor", "trace"]);
    expect(pack.snapshot).toBe("snap-1");
    expect(pack.assembledAt).toBe("2026-09-30T09:00:00.000Z");
    expect(Object.keys(pack).sort()).toEqual([
      "assembledAt",
      "ids",
      "queries",
      "snapshot",
      "text",
    ]);
  });
});
