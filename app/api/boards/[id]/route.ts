import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    note: "MVP uses client-side localStorage. Migrate to Supabase in Phase 2.",
  });
}

export async function PUT() {
  return NextResponse.json({ ok: true, note: "MVP: board saved client-side" });
}

export async function DELETE() {
  return NextResponse.json({ ok: true, note: "MVP: board deleted client-side" });
}
