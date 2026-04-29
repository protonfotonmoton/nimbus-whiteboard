import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { elements } = await request.json();
    if (!elements || !Array.isArray(elements)) {
      return NextResponse.json({ error: "elements array required" }, { status: 400 });
    }

    // Server-side mermaid conversion uses the same logic as client
    // Import dynamically to avoid bundling issues
    const { convertToMermaid } = await import("@/lib/mermaid/convert");
    const mermaid = convertToMermaid(elements);

    return NextResponse.json({ mermaid });
  } catch {
    return NextResponse.json({ error: "Failed to convert" }, { status: 500 });
  }
}
