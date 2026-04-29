"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Canvas from "@/components/Canvas";
import Nav from "@/components/Nav";
import MermaidPreview from "@/components/MermaidPreview";
import { getBoard, type Board } from "@/lib/boards";
import { useDevice } from "@/hooks/useDevice";
import type { ExcalidrawElement } from "@/lib/types";

export default function BoardPage() {
  const params = useParams();
  const router = useRouter();
  const device = useDevice();
  const [board, setBoard] = useState<Board | null>(null);
  const [loading, setLoading] = useState(true);
  const [showMermaid, setShowMermaid] = useState(false);
  const [elements, setElements] = useState<readonly ExcalidrawElement[]>([]);

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
      <div className="flex items-center justify-center h-[100dvh] bg-nimbus-bg">
        <div className="w-8 h-8 border-2 border-nimbus-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const boardData = board.excalidraw_data as { elements?: ExcalidrawElement[]; appState?: Record<string, unknown> };

  return (
    <div className="canvas-page flex flex-col bg-nimbus-bg">
      <Nav
        boardName={board.name}
        boardId={board.id}
        onToggleMermaid={() => setShowMermaid(!showMermaid)}
        showMermaid={showMermaid}
      />
      <div className="flex flex-1 min-h-0">
        <div className="flex-1 relative min-h-0">
          <Canvas
            boardId={board.id}
            initialData={{
              elements: boardData?.elements,
              appState: boardData?.appState,
            }}
            onExport={setElements}
          />
        </div>
        {device === "desktop" && showMermaid && (
          <MermaidPreview elements={elements} />
        )}
      </div>
    </div>
  );
}
