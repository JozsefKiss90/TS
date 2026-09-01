// A miniature knowledge graph for exercise 09.
//
// The real dev_graph is Python-side and stays there (MISSION: Python's
// territory is respected). This snapshot stands in for it so the MCP
// surface can be built and poked with no Python process and no network.
// The nodes describe artifacts this course has already built, so every
// query you try has an answer you can check against your own repo.
//
// Provenance fields (source, confidence, freshness) arrive in lesson
// 0014 with the evidence schema. Here a node is deliberately minimal.

export interface GraphNode {
  id: string;
  type: "module" | "contract";
  title: string;
  status: "implemented" | "prepared" | "planned";
  dependsOn: string[];
}

export const GRAPH: GraphNode[] = [
  { id: "gateway", type: "module", title: "ModelGateway port", status: "implemented", dependsOn: [] },
  { id: "anthropic-adapter", type: "module", title: "Anthropic adapter", status: "implemented", dependsOn: ["gateway"] },
  { id: "fake-gateway", type: "module", title: "FakeModelGateway", status: "implemented", dependsOn: ["gateway"] },
  { id: "taskspec", type: "contract", title: "TaskSpec schema", status: "implemented", dependsOn: [] },
  { id: "supervisor", type: "module", title: "Job supervisor loop", status: "implemented", dependsOn: ["gateway", "taskspec"] },
  { id: "approval-gate", type: "module", title: "Approval gate", status: "implemented", dependsOn: ["supervisor"] },
  { id: "trace-log", type: "module", title: "JSON Lines trace", status: "implemented", dependsOn: ["supervisor"] },
  { id: "evidence-schema", type: "contract", title: "Evidence schema", status: "planned", dependsOn: [] },
];

export function findNode(id: string): GraphNode | undefined {
  return GRAPH.find((node) => node.id === id);
}

export function searchNodes(query: string, limit: number): GraphNode[] {
  const needle = query.toLowerCase();
  return GRAPH.filter(
    (node) => node.id.toLowerCase().includes(needle) || node.title.toLowerCase().includes(needle),
  ).slice(0, limit);
}
