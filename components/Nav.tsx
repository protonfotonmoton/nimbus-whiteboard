"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDevice } from "@/hooks/useDevice";
import ExportMenu from "@/components/ExportMenu";
import { updateBoard } from "@/lib/boards";

interface NavProps {
  boardName: string;
  boardId: string;
  onToggleMermaid?: () => void;
  showMermaid?: boolean;
  hideLegacyExport?: boolean;
}

export default function Nav({
  boardName,
  boardId,
  onToggleMermaid,
  showMermaid,
  hideLegacyExport,
}: NavProps) {
  const router = useRouter();
  const device = useDevice();
  const [name, setName] = useState(boardName);
  const [editing, setEditing] = useState(false);
  const [showExport, setShowExport] = useState(false);

  function handleNameSave() {
    setEditing(false);
    if (name.trim() && name !== boardName) {
      updateBoard(boardId, { name: name.trim() });
    }
  }

  return (
    <nav className="flex items-center justify-between h-12 px-4 bg-nimbus-surface/90 backdrop-blur-lg border-b border-nimbus-border-subtle shrink-0 z-20">
      {/* Left: Back + Board Name */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/")}
          className="p-1.5 rounded-lg hover:bg-nimbus-elevated transition-colors"
          title="Back to boards"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-nimbus-text-muted">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>

        {editing ? (
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={handleNameSave}
            onKeyDown={(e) => e.key === "Enter" && handleNameSave()}
            className="bg-transparent border border-nimbus-border rounded-md px-2 py-0.5 text-sm font-medium text-nimbus-text outline-none focus:border-nimbus-orange"
          />
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="text-sm font-medium text-nimbus-text hover:text-nimbus-orange transition-colors"
          >
            {name}
          </button>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {device === "desktop" && onToggleMermaid && (
          <button
            onClick={onToggleMermaid}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              showMermaid
                ? "bg-nimbus-cyan/10 text-nimbus-cyan border border-nimbus-cyan/20"
                : "text-nimbus-text-muted hover:bg-nimbus-elevated"
            }`}
          >
            Mermaid
          </button>
        )}

        {!hideLegacyExport && (
          <div className="relative">
            <button
              onClick={() => setShowExport(!showExport)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-nimbus-text-muted hover:bg-nimbus-elevated transition-colors"
            >
              Export
            </button>
            {showExport && (
              <ExportMenu boardId={boardId} onClose={() => setShowExport(false)} />
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
