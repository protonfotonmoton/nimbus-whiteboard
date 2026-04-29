import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "nimbus-whiteboard",
    version: "1.0.0",
    ts: new Date().toISOString(),
  });
}
