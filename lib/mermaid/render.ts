export async function renderMermaid(definition: string): Promise<string> {
  if (typeof window === "undefined") return "";

  const mermaid = (await import("mermaid")).default;

  mermaid.initialize({
    startOnLoad: false,
    theme: "dark",
    themeVariables: {
      primaryColor: "#161619",
      primaryTextColor: "#f7f8f8",
      primaryBorderColor: "#c9a84c",
      lineColor: "#00d4ff",
      secondaryColor: "#111114",
      tertiaryColor: "#1c1c20",
      background: "#0a0a0a",
      mainBkg: "#161619",
      nodeBorder: "#c9a84c",
      clusterBkg: "#111114",
      clusterBorder: "#c9a84c",
      titleColor: "#f7f8f8",
      edgeLabelBackground: "#111114",
    },
    flowchart: {
      htmlLabels: true,
      curve: "basis",
    },
  });

  try {
    const id = `mermaid-${Date.now()}`;
    const { svg } = await mermaid.render(id, definition);
    return svg;
  } catch {
    return `<div class="text-red-400 text-xs p-2">Invalid Mermaid syntax</div>`;
  }
}
