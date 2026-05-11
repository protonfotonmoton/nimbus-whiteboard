"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Nav from "@/components/Nav";
import NimbusTldrawCanvas from "@/components/NimbusTldrawCanvas";
import { getBoard, type Board } from "@/lib/boards";

export default function BoardPage() {
  const params = useParams();
  const router = useRouter();
  const [board, setBoard] = useState<Board | null>(null);
  const [loading, setLoading] = useState(true);

  const boardId = params.id as string;

  useEffect(() => {
    const b = getBoard(boardId);
    if (!b) {
      router.push("/");
      return;
    }
    setBoard(b);
    setLoading(false);
  }, [boardId, router]);

  if (loading || !board) {
    return (
      <div className="flex items-center justify-center w-screen h-[100dvh] bg-nimbus-bg">
        <div className="w-8 h-8 border-2 border-nimbus-orange border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="canvas-page flex flex-col bg-nimbus-bg">
      <Nav
        boardName={board.name}
        boardId={board.id}
        hideLegacyExport
      />
      <div className="flex-1 flex min-h-0 min-w-0 relative">
        <div className="flex-1 relative min-h-0 min-w-0">
          <NimbusTldrawCanvas board={board} />
        </div>
      </div>
    </div>
  );
}
