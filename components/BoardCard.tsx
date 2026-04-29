"use client";

import { useRouter } from "next/navigation";
import type { Board } from "@/lib/boards";

interface BoardCardProps {
  board: Board;
  onDelete: (id: string) => void;
}

export default function BoardCard({ board, onDelete }: BoardCardProps) {
  const router = useRouter();

  function formatDate(iso: string) {
    const d = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return "just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }

  return (
    <div
      onClick={() => router.push(`/board/${board.id}`)}
      className="group bg-nimbus-card border border-nimbus-border rounded-xl cursor-pointer hover:border-nimbus-gold/30 transition-all duration-200"
    >
      {/* Thumbnail area */}
      <div className="aspect-video bg-nimbus-bg rounded-t-xl flex items-center justify-center border-b border-nimbus-border-subtle">
        {board.element_count > 0 ? (
          <div className="text-nimbus-text-dim text-xs">
            {board.element_count} elements
          </div>
        ) : (
          <div className="text-nimbus-text-dim text-xs opacity-50">Empty board</div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-medium text-nimbus-text truncate group-hover:text-nimbus-gold transition-colors">
            {board.name}
          </h3>
          <p className="text-xs text-nimbus-text-muted mt-0.5">
            {formatDate(board.updated_at)}
          </p>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(board.id);
          }}
          className="p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-red-500/10 text-nimbus-text-dim hover:text-red-400 transition-all"
          title="Delete board"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
          </svg>
        </button>
      </div>
    </div>
  );
}
