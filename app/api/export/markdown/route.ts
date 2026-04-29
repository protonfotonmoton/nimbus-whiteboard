import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { elements, boardName } = await request.json();
    if (!elements || !Array.isArray(elements)) {
      return NextResponse.json({ error: "elements array required" }, { status: 400 });
    }

    const textElements = elements
      .filter((el: Record<string, unknown>) => el.type === "text" && el.text)
      .sort((a: Record<string, unknown>, b: Record<string, unknown>) =>
        ((a.y as number) || 0) - ((b.y as number) || 0)
      )
      .map((el: Record<string, unknown>) => `- ${el.text}`);

    const md = `# ${boardName || "Board Export"}\n\nExported: ${new Date().toISOString()}\n\n## Content\n\n${textElements.join("\n") || "*(no text elements)*"}`;

    return new NextResponse(md, {
      headers: {
        "Content-Type": "text/markdown",
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to export" }, { status: 500 });
  }
}
