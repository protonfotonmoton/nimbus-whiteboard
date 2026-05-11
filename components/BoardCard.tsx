"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Board } from "@/lib/boards";
import { sendBoardToVamp } from "@/lib/vamp-bridge";

interface BoardCardProps {
  board: Board;
  onDelete: (id: string) => void;
}

export default function BoardCard({ board, onDelete }: BoardCardProps) {
  const router = useRouter();
  const [vampStatus, setVampStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  function formatDate(iso: string) {
    const d = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return "just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }

  async function handleSendToVamp(e: React.MouseEvent) {
    e.stopPropagation();
    if (vampStatus === "sending") return;
    setVampStatus("sending");
    const result = await sendBoardToVamp(board);
    setVampStatus(result.ok ? "sent" : "error");
    window.setTimeout(() => setVampStatus("idle"), 2200);
  }

  const vampLabel =
    vampStatus === "sending" ? "..."
      : vampStatus === "sent" ? "sent ✓"
      : vampStatus === "error" ? "err"
      : "→ VAMP";

  return (
    <div
      onClick={() => router.push(`/board/${board.id}`)}
      className="group bg-nimbus-card border border-nimbus-border rounded-xl cursor-pointer hover:border-nimbus-orange/30 transition-all duration-200"
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
      <div className="p-3 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-medium text-nimbus-text truncate group-hover:text-nimbus-orange transition-colors">
            {board.name}
          </h3>
          <p className="text-xs text-nimbus-text-muted mt-0.5">
            {formatDate(board.updated_at)}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {/* Send-to-VAMP button — pings the board snapshot to VAMP via the
              Cloudflare tunnel so VAMP can see what you just drew. */}
          <button
            onClick={handleSendToVamp}
            className={`text-[10px] font-mono uppercase tracking-wider px-2 py-1 rounded-md border transition-all opacity-0 group-hover:opacity-100 ${
              vampStatus === "sent"
                ? "border-green-400/40 text-green-400 bg-green-400/10"
                : vampStatus === "error"
                ? "border-red-400/40 text-red-400 bg-red-400/10"
                : "border-nimbus-orange/30 text-nimbus-orange hover:bg-nimbus-orange/10"
            }`}
            title="Send this board to VAMP"
            disabled={vampStatus === "sending"}
          >
            {vampLabel}
          </button>
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
    </div>
  );
}
