import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      status: "not_implemented",
      message: "Deploy Idea pipeline integration coming in Phase 2. Will connect to ni1 intake + CrewAI supercharger.",
      pipeline: [
        "1. Canvas JSON + PNG snapshot",
        "2. GPT-4 Vision → Mermaid + Markdown",
        "3. ni1 score (clarity/novelty/buildability/relevance/impact)",
        "4. KEEP/AMPLIFY → CrewAI auto-deploy",
      ],
    },
    { status: 501 }
  );
}
