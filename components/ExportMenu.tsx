"use client";

import { useEffect, useRef } from "react";
import { getBoard } from "@/lib/boards";
import { convertToMermaid } from "@/lib/mermaid/convert";

interface ExportMenuProps {
  boardId: string;
  onClose: () => void;
}

export default function ExportMenu({ boardId, onClose }: ExportMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  function exportJSON() {
    const board = getBoard(boardId);
    if (!board) return;
    const blob = new Blob([JSON.stringify(board.excalidraw_data, null, 2)], { type: "application/json" });
    download(blob, `${board.name}.json`);
    onClose();
  }

  function exportMermaid() {
    const board = getBoard(boardId);
    if (!board) return;
    const data = board.excalidraw_data as { elements?: Array<Record<string, unknown>> };
    const mermaid = convertToMermaid(data.elements || []);
    const blob = new Blob([mermaid], { type: "text/plain" });
    download(blob, `${board.name}.mmd`);
    onClose();
  }

  function exportMarkdown() {
    const board = getBoard(boardId);
    if (!board) return;
    const data = board.excalidraw_data as { elements?: Array<Record<string, unknown>> };
    const elements = data.elements || [];
    const textElements = elements
      .filter((el) => el.type === "text" && el.text)
      .sort((a, b) => ((a.y as number) || 0) - ((b.y as number) || 0))
      .map((el) => `- ${el.text}`);
    const md = `# ${board.name}\n\nExported: ${new Date().toISOString()}\n\n## Content\n\n${textElements.join("\n") || "*(no text elements)*"}`;
    const blob = new Blob([md], { type: "text/markdown" });
    download(blob, `${board.name}.md`);
    onClose();
  }

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-1 w-48 bg-nimbus-card border border-nimbus-border rounded-xl shadow-2xl shadow-black/40 z-50 overflow-hidden"
    >
      <button onClick={exportJSON} className="w-full px-3 py-2.5 text-left text-sm text-nimbus-text-secondary hover:bg-nimbus-elevated transition-colors flex items-center gap-2">
        <span className="text-nimbus-gold">{ "{}" }</span> JSON
      </button>
      <button onClick={exportMermaid} className="w-full px-3 py-2.5 text-left text-sm text-nimbus-text-secondary hover:bg-nimbus-elevated transition-colors flex items-center gap-2">
        <span className="text-nimbus-cyan">&#9670;</span> Mermaid
      </button>
      <button onClick={exportMarkdown} className="w-full px-3 py-2.5 text-left text-sm text-nimbus-text-secondary hover:bg-nimbus-elevated transition-colors flex items-center gap-2">
        <span className="text-nimbus-text-muted">#</span> Markdown
      </button>
      <div className="border-t border-nimbus-border-subtle" />
      <button
        disabled
        className="w-full px-3 py-2.5 text-left text-sm text-nimbus-text-dim cursor-not-allowed flex items-center gap-2"
      >
        <span>&#9889;</span> Deploy Idea <span className="text-[10px] bg-nimbus-elevated px-1.5 py-0.5 rounded">Phase 2</span>
      </button>
    </div>
  );
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
