import { NextResponse } from "next/server";

export async function POST() {
  // PNG export happens client-side via Excalidraw's built-in export
  // This route is a placeholder for server-side rendering in Phase 2
  return NextResponse.json({
    note: "PNG export is client-side in Phase 1. Server-side rendering via @excalidraw/utils in Phase 2.",
  });
}
