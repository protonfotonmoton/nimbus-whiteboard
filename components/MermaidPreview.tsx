"use client";

import { useEffect, useState, useCallback } from "react";
import { convertToMermaid } from "@/lib/mermaid/convert";
import { renderMermaid } from "@/lib/mermaid/render";
import type { ExcalidrawElement } from "@/lib/types";

interface MermaidPreviewProps {
  elements: readonly ExcalidrawElement[];
}

export default function MermaidPreview({ elements }: MermaidPreviewProps) {
  const [svg, setSvg] = useState("");
  const [mermaidCode, setMermaidCode] = useState("");
  const [showCode, setShowCode] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const code = convertToMermaid(elements as unknown as Array<Record<string, unknown>>);
    setMermaidCode(code);
    renderMermaid(code).then(setSvg);
  }, [elements]);

  const copyCode = useCallback(() => {
    navigator.clipboard.writeText(mermaidCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [mermaidCode]);

  return (
    <div className="w-80 bg-nimbus-surface border-l border-nimbus-border-subtle flex flex-col shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-nimbus-border-subtle">
        <span className="text-xs font-medium text-nimbus-cyan">Mermaid Preview</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowCode(!showCode)}
            className={`px-2 py-1 rounded text-[10px] transition-colors ${
              showCode ? "bg-nimbus-cyan/10 text-nimbus-cyan" : "text-nimbus-text-muted hover:bg-nimbus-elevated"
            }`}
          >
            {showCode ? "Diagram" : "Code"}
          </button>
          <button
            onClick={copyCode}
            className="px-2 py-1 rounded text-[10px] text-nimbus-text-muted hover:bg-nimbus-elevated transition-colors"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-3">
        {showCode ? (
          <pre className="text-xs text-nimbus-text-secondary font-mono whitespace-pre-wrap break-words">
            {mermaidCode}
          </pre>
        ) : (
          <div
            className="mermaid-preview"
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        )}
      </div>
    </div>
  );
}
