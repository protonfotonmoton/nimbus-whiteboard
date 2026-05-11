import { NextRequest, NextResponse } from "next/server";

// Server-side proxy: browser POSTs board snapshots here, we forward to
// vamp-tools-mac via the tunnel with the bearer token. Keeps the token
// off the client bundle.

const VAMP_TOOLS_BASE_URL =
  process.env.VAMP_TOOLS_BASE_URL || "https://vamp-tools.nimbusphere.ai";
const VAMP_TOOLS_TOKEN = process.env.VAMP_TOOLS_TOKEN || "";

export async function POST(req: NextRequest) {
  if (!VAMP_TOOLS_TOKEN) {
    return NextResponse.json(
      { ok: false, error: "VAMP_TOOLS_TOKEN missing on server" },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid JSON" }, { status: 400 });
  }

  try {
    const r = await fetch(`${VAMP_TOOLS_BASE_URL}/tools/whiteboard_event`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${VAMP_TOOLS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10000),
    });
    const j = await r.json().catch(() => ({}));
    return NextResponse.json(j, { status: r.status });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : String(e) },
      { status: 502 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    proxy: "vamp-tools whiteboard_event",
    upstream: VAMP_TOOLS_BASE_URL,
    auth: VAMP_TOOLS_TOKEN ? "configured" : "missing",
  });
}
