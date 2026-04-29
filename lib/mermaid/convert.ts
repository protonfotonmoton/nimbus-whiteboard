interface ExcalidrawEl {
  id: string;
  type: string;
  text?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  startBinding?: { elementId: string } | null;
  endBinding?: { elementId: string } | null;
  label?: { text: string };
  boundElements?: Array<{ id: string; type: string }>;
  isDeleted?: boolean;
}

export function convertToMermaid(elements: Array<Record<string, unknown>>): string {
  const els = elements as unknown as ExcalidrawEl[];
  const visible = els.filter((el) => !el.isDeleted);

  const nodes: Map<string, string> = new Map();
  const edges: Array<{ from: string; to: string; label?: string }> = [];

  // Collect text and shape elements as nodes
  for (const el of visible) {
    if (el.type === "text" && el.text) {
      const sanitized = el.text.replace(/[[\](){}|]/g, " ").trim();
      if (sanitized) nodes.set(el.id, sanitized);
    } else if (
      (el.type === "rectangle" || el.type === "diamond" || el.type === "ellipse") &&
      el.boundElements
    ) {
      // Shape with bound text — find the text
      const boundText = el.boundElements.find((b) => b.type === "text");
      if (boundText) {
        const textEl = visible.find((e) => e.id === boundText.id);
        if (textEl?.text) {
          const sanitized = textEl.text.replace(/[[\](){}|]/g, " ").trim();
          nodes.set(el.id, sanitized);
        }
      } else {
        nodes.set(el.id, el.type);
      }
    }
  }

  // If no nodes, try to extract from shapes without bound text
  if (nodes.size === 0) {
    for (const el of visible) {
      if (el.type === "rectangle" || el.type === "diamond" || el.type === "ellipse") {
        nodes.set(el.id, `${el.type}_${el.id.slice(0, 4)}`);
      }
    }
  }

  // Collect arrows as edges
  for (const el of visible) {
    if (el.type === "arrow" || el.type === "line") {
      const from = el.startBinding?.elementId;
      const to = el.endBinding?.elementId;
      if (from && to && (nodes.has(from) || findNearestNode(from, visible, nodes)) && (nodes.has(to) || findNearestNode(to, visible, nodes))) {
        const fromId = nodes.has(from) ? from : findNearestNode(from, visible, nodes) || from;
        const toId = nodes.has(to) ? to : findNearestNode(to, visible, nodes) || to;
        edges.push({ from: fromId, to: toId });
      }
    }
  }

  // Build Mermaid output
  if (nodes.size === 0) {
    return "graph TD\n    A[No elements to convert]";
  }

  let mermaid = "graph TD\n";

  // Add nodes
  const nodeIds = new Map<string, string>();
  let counter = 0;
  Array.from(nodes.entries()).forEach(([id, label]) => {
    const shortId = String.fromCharCode(65 + (counter % 26)) + (counter >= 26 ? String(Math.floor(counter / 26)) : "");
    nodeIds.set(id, shortId);
    mermaid += `    ${shortId}["${label}"]\n`;
    counter++;
  });

  // Add edges
  for (const edge of edges) {
    const fromId = nodeIds.get(edge.from);
    const toId = nodeIds.get(edge.to);
    if (fromId && toId) {
      mermaid += `    ${fromId} --> ${toId}\n`;
    }
  }

  // Style
  mermaid += "\n    classDef default fill:#161619,stroke:#c9a84c,color:#f7f8f8\n";
  mermaid += "    linkStyle default stroke:#00d4ff\n";

  return mermaid;
}

function findNearestNode(
  _elementId: string,
  _elements: ExcalidrawEl[],
  nodes: Map<string, string>
): string | null {
  // For Phase 1, just return null — spatial matching comes in Phase 2
  return nodes.size > 0 ? Array.from(nodes.keys())[0] ?? null : null;
}
