// Nimbus Whiteboard → VAMP bridge.
// Browser-side helper that POSTs board snapshots to our Next.js API proxy
// at /api/vamp/event, which forwards (with bearer auth) to vamp-tools-mac
// over the Cloudflare tunnel.
//
// VAMP desktop listens to vamp-tools-mac's SSE event_stream and surfaces
// these snapshots in real time so the founder can say "VAMP, look at what
// I just whiteboarded" and VAMP already knows the board state.

import type { Board } from "./boards";

export interface WhiteboardSnapshot {
  boardId: string;
  boardName: string;
  elementCount: number;
  // Compact element summary so we don't ship megabytes per send.
  // Full tldraw export is available via the existing ExportMenu.
  elements?: unknown;
  ts: number;
}

export async function sendBoardToVamp(
  board: Board,
  options?: { elements?: unknown }
): Promise<{ ok: boolean; error?: string }> {
  const snapshot: WhiteboardSnapshot = {
    boardId: board.id,
    boardName: board.name,
    elementCount: board.element_count,
    elements: options?.elements,
    ts: Date.now(),
  };

  try {
    const r = await fetch("/api/vamp/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        boardId: snapshot.boardId,
        boardName: snapshot.boardName,
        snapshot,
        ts: snapshot.ts,
      }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) return { ok: false, error: j?.error || `HTTP ${r.status}` };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
