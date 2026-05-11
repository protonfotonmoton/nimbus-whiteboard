"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import BoardCard from "@/components/BoardCard";
import { listBoards, createBoard, deleteBoard, type Board } from "@/lib/boards";

export default function BoardList() {
  const router = useRouter();
  const [boards, setBoards] = useState<Board[]>([]);

  useEffect(() => {
    setBoards(listBoards());
  }, []);

  function handleCreate() {
    const board = createBoard();
    router.push(`/board/${board.id}`);
  }

  function handleDelete(id: string) {
    deleteBoard(id);
    setBoards(listBoards());
  }

  return (
    <div className="board-list-page min-h-[100dvh] bg-nimbus-bg">
      {/* Header */}
      <header className="border-b border-nimbus-border-subtle">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-nimbus-text tracking-tight">
              Nimbus Whiteboard
            </h1>
            <p className="text-sm text-nimbus-text-muted mt-1">
              {boards.length} board{boards.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-nimbus-orange text-nimbus-bg rounded-lg text-sm font-medium hover:brightness-110 transition-all active:scale-95"
          >
            + New Board
          </button>
        </div>
      </header>

      {/* Grid */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {boards.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-nimbus-card border border-nimbus-border flex items-center justify-center mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-nimbus-orange">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M3 9h18M9 3v18" />
              </svg>
            </div>
            <h2 className="text-lg font-medium text-nimbus-text mb-1">No boards yet</h2>
            <p className="text-sm text-nimbus-text-muted mb-6">Create your first board to start capturing ideas</p>
            <button
              onClick={handleCreate}
              className="px-5 py-2.5 bg-nimbus-orange text-nimbus-bg rounded-lg text-sm font-medium hover:brightness-110 transition-all active:scale-95"
            >
              Create Board
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {boards.map((board) => (
              <BoardCard key={board.id} board={board} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </main>

      {/* Mobile/Tablet FAB */}
      <button
        onClick={handleCreate}
        className="fixed bottom-6 right-6 lg:hidden w-14 h-14 bg-nimbus-orange rounded-full shadow-lg shadow-nimbus-orange/20 flex items-center justify-center text-nimbus-bg text-2xl font-light hover:scale-105 active:scale-95 transition-transform z-50"
      >
        +
      </button>
    </div>
  );
}
