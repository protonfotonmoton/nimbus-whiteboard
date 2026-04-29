import { NextRequest, NextResponse } from "next/server";

// Note: Board storage is client-side (localStorage) for MVP
// These routes serve as the API contract for Phase 2 Supabase migration

export async function GET() {
  return NextResponse.json({
    boards: [],
    note: "MVP uses client-side localStorage. Migrate to Supabase in Phase 2.",
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  return NextResponse.json({
    id: `board_${Date.now()}`,
    name: body.name || "Untitled Board",
    created_at: new Date().toISOString(),
    note: "MVP uses client-side localStorage. Board created on client.",
  });
}
