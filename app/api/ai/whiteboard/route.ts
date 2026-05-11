import { NextResponse } from "next/server";
import { z } from "zod";
import { vectorOperationBatchSchema, type VectorOperation } from "@/lib/ai/operation-schema";

const actionSchema = z.enum([
  "clean_ink",
  "diagram",
  "explain",
  "finish_sketch",
  "generate_svg",
  "prompt",
]);

const shapeSummarySchema = z.object({
  id: z.string(),
  type: z.string(),
  x: z.number().finite(),
  y: z.number().finite(),
  w: z.number().finite().optional(),
  h: z.number().finite().optional(),
  text: z.string().max(4000).optional(),
});

const requestSchema = z.object({
  action: actionSchema,
  boardName: z.string().max(200).optional(),
  prompt: z.string().max(4000).optional(),
  shapes: z.array(shapeSummarySchema).max(120),
  canvasJson: z.unknown().optional(),
  svg: z.string().max(300_000).optional(),
  screenshotDataUrl: z.string().max(2_000_000).optional(),
});

const aiResponseSchema = z.object({
  summary: z.string().max(8000).optional(),
  operations: vectorOperationBatchSchema.shape.operations.optional(),
  svg: z.string().max(300_000).optional(),
});

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "0.0.0.0"]);

function isPrivateLanHost(hostname: string) {
  if (LOCAL_HOSTS.has(hostname)) return true;
  if (hostname.startsWith("10.")) return true;
  if (hostname.startsWith("192.168.")) return true;

  const match = hostname.match(/^172\.(\d{1,2})\./);
  if (!match) return false;

  const secondOctet = Number(match[1]);
  return secondOctet >= 16 && secondOctet <= 31;
}

function getLocalAiBaseUrl() {
  const configured = process.env.NIMBUS_LOCAL_AI_BASE_URL || "http://127.0.0.1:11434";
  const url = new URL(configured);
  if (!isPrivateLanHost(url.hostname)) {
    throw new Error("NIMBUS_LOCAL_AI_BASE_URL must point to localhost or a private LAN host.");
  }
  return url;
}

async function chooseOllamaModel(baseUrl: URL) {
  if (process.env.NIMBUS_LOCAL_AI_MODEL) return process.env.NIMBUS_LOCAL_AI_MODEL;

  const response = await fetch(new URL("/api/tags", baseUrl), {
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Local AI did not return an Ollama model list.");

  const data = await response.json();
  const models = z
    .object({
      models: z.array(z.object({ name: z.string() })),
    })
    .parse(data)
    .models.map((model) => model.name);

  const preferred = [
    "gemma4",
    "llama3.2-vision",
    "llava",
    "qwen2.5-coder",
    "qwen2.5",
    "llama3.2",
    "llama3.1",
    "mistral",
  ];
  for (const name of preferred) {
    const model = models.find((candidate) => candidate.startsWith(name));
    if (model) return model;
  }
  return models[0];
}

function stripDataUrl(dataUrl?: string) {
  if (!dataUrl) return undefined;
  const commaIndex = dataUrl.indexOf(",");
  return commaIndex === -1 ? dataUrl : dataUrl.slice(commaIndex + 1);
}

function extractJsonObject(text: string) {
  const trimmed = text.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) return trimmed;

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) return fenced[1].trim();

  const first = trimmed.indexOf("{");
  const last = trimmed.lastIndexOf("}");
  if (first !== -1 && last !== -1 && last > first) {
    return trimmed.slice(first, last + 1);
  }

  throw new Error("Local AI did not return a JSON object.");
}

function actionInstruction(action: z.infer<typeof actionSchema>) {
  if (action === "explain") {
    return "Explain the board clearly. Return only summary. Do not include operations unless a tiny annotation would materially help.";
  }
  if (action === "diagram") {
    return "Create a clean vector diagram from the selected board content. Prefer 3-8 rectangles/notes and connecting arrows.";
  }
  if (action === "clean_ink") {
    return "Convert rough ink/sketch strokes into cleaner vector primitives. Use delete_shapes only for supplied existing shape ids. Prefer rectangles, ellipses, arrows, text, and notes.";
  }
  if (action === "finish_sketch") {
    return "Continue the selected sketch with a small number of plausible vector shapes. Keep additions near the selected coordinates.";
  }
  if (action === "prompt") {
    return "Follow the user's custom instruction. If they ask for changes, return validated operations. If they ask a question, return summary. If they ask for an SVG, return svg.";
  }
  return "Generate a standalone SVG inspired by the selected board content. Also include a short summary.";
}

function buildPrompt(input: z.infer<typeof requestSchema>) {
  return [
    "You are Nimbus Local AI for a vector whiteboard. You must return strict JSON only.",
    "",
    `Action: ${input.action}`,
    actionInstruction(input.action),
    input.prompt ? `User prompt: ${input.prompt}` : "",
    "",
    "Allowed JSON response shape:",
    JSON.stringify({
      summary: "optional markdown summary",
      operations: [
        {
          op: "create_shape | create_text | create_note | create_arrow | delete_shapes | update_text",
          id: "optional id",
        },
      ],
      svg: "<svg>optional valid svg markup</svg>",
    }),
    "",
    "Allowed operations:",
    "- create_shape: {op,id?,shape:'rectangle'|'ellipse'|'diamond'|'triangle'|'cloud',x,y,w,h,text?,color?}",
    "- create_text: {op,id?,x,y,text}",
    "- create_note: {op,id?,x,y,text}",
    "- create_arrow: {op,id?,start:{x,y},end:{x,y},text?}",
    "- delete_shapes: {op,ids:[existing shape ids only]}",
    "- update_text: {op,id,text}",
    "",
    "Coordinate rules: use the same page coordinate system as the shape summaries. Keep widths/heights between 8 and 4000.",
    "Safety rules: do not invent operation names. Do not return markdown fences. Do not call external tools.",
    "For clean_ink, diagram, finish_sketch, or any custom prompt asking you to draw/change/finish/complete/add/convert/create something, return a non-empty operations array.",
    "",
    `Board: ${input.boardName || "Untitled"}`,
    `Shape summaries: ${JSON.stringify(input.shapes).slice(0, 60_000)}`,
    input.svg ? `Current SVG excerpt: ${input.svg.slice(0, 40_000)}` : "",
    input.canvasJson ? `Canvas JSON excerpt: ${JSON.stringify(input.canvasJson).slice(0, 80_000)}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

type RequestInput = z.infer<typeof requestSchema>;

function shapeBounds(shapes: RequestInput["shapes"]) {
  if (!shapes.length) return { x: 0, y: 0, w: 260, h: 160 };
  const minX = Math.min(...shapes.map((shape) => shape.x));
  const minY = Math.min(...shapes.map((shape) => shape.y));
  const maxX = Math.max(...shapes.map((shape) => shape.x + (shape.w || 120)));
  const maxY = Math.max(...shapes.map((shape) => shape.y + (shape.h || 80)));
  return {
    x: minX,
    y: minY,
    w: Math.max(120, maxX - minX),
    h: Math.max(80, maxY - minY),
  };
}

function wantsOperations(input: RequestInput) {
  if (["clean_ink", "diagram", "finish_sketch"].includes(input.action)) return true;
  if (input.action !== "prompt") return false;
  return /\b(finish|complete|draw|add|make|turn|convert|clean|diagram|create|fix|change|vector)\b/i.test(
    input.prompt || ""
  );
}

function fallbackOperations(input: RequestInput): VectorOperation[] {
  const bounds = shapeBounds(input.shapes);

  if (input.action === "clean_ink") {
    return input.shapes
      .filter((shape) => shape.type === "draw" || shape.type === "line")
      .flatMap((shape, index): VectorOperation[] => {
        const w = Math.max(32, shape.w || 96);
        const h = Math.max(32, shape.h || 64);
        return [
          { op: "delete_shapes", ids: [shape.id] },
          {
            op: "create_shape",
            id: `cleaned_${index}`,
            shape: w > h * 1.35 ? "rectangle" : "ellipse",
            x: shape.x,
            y: shape.y,
            w,
            h,
            color: "light-blue",
          },
        ];
      });
  }

  if (input.action === "diagram") {
    const labels = input.shapes
      .map((shape) => shape.text)
      .filter((text): text is string => Boolean(text))
      .slice(0, 4);
    const safeLabels = labels.length ? labels : ["Sketch", "Structure", "Next Step"];
    return safeLabels.flatMap((label, index): VectorOperation[] => {
      const x = bounds.x + index * 230;
      const node: VectorOperation = {
        op: "create_shape",
        id: `diagram_node_${index}`,
        shape: "rectangle",
        x,
        y: bounds.y + bounds.h + 80,
        w: 180,
        h: 80,
        text: label,
        color: index === 1 ? "yellow" : "light-blue",
      };
      if (index === 0) return [node];
      return [
        {
          op: "create_arrow",
          id: `diagram_arrow_${index}`,
          start: { x: x - 46, y: bounds.y + bounds.h + 120 },
          end: { x: x - 10, y: bounds.y + bounds.h + 120 },
        },
        node,
      ];
    });
  }

  return [
    {
      op: "create_arrow",
      id: "finish_arrow",
      start: { x: bounds.x + bounds.w + 24, y: bounds.y + bounds.h / 2 },
      end: { x: bounds.x + bounds.w + 154, y: bounds.y + bounds.h / 2 },
      text: "finish",
    },
    {
      op: "create_shape",
      id: "finish_frame",
      shape: "cloud",
      x: bounds.x + bounds.w + 180,
      y: bounds.y,
      w: Math.max(180, Math.min(360, bounds.w * 0.72)),
      h: Math.max(100, Math.min(240, bounds.h * 0.72)),
      text: input.prompt || "continued sketch",
      color: "yellow",
    },
  ];
}

async function callOllama(input: z.infer<typeof requestSchema>) {
  const baseUrl = getLocalAiBaseUrl();
  const model = await chooseOllamaModel(baseUrl);
  if (!model) throw new Error("No local Ollama models are installed.");

  const image = stripDataUrl(input.screenshotDataUrl);
  const userMessage: Record<string, unknown> = {
    role: "user",
    content: buildPrompt(input),
  };
  if (image) userMessage.images = [image];

  const body = {
    model,
    stream: false,
    format: "json",
    messages: [
      {
        role: "system",
        content:
          "Return strict JSON only. Never use cloud services. Never include prose outside JSON.",
      },
      userMessage,
    ],
    options: {
      temperature: input.action === "finish_sketch" ? 0.55 : 0.2,
    },
  };

  let response = await fetch(new URL("/api/chat", baseUrl), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok && image) {
    const retryBody = {
      ...body,
      messages: body.messages.map((message) =>
        message === userMessage ? { role: "user", content: buildPrompt(input) } : message
      ),
    };
    response = await fetch(new URL("/api/chat", baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(retryBody),
    });
  }

  if (!response.ok) {
    throw new Error(`Local AI request failed with ${response.status}.`);
  }

  const data = await response.json();
  const content = z
    .object({
      message: z.object({ content: z.string() }),
    })
    .parse(data).message.content;

  const parsed = JSON.parse(extractJsonObject(content));
  const safe = aiResponseSchema.parse(parsed);

  if (input.action === "explain") {
    return {
      model,
      summary: safe.summary,
    };
  }

  if (input.action === "generate_svg") {
    return {
      model,
      summary: safe.summary,
      svg: safe.svg,
    };
  }

  const operations =
    safe.operations?.length || !wantsOperations(input) ? safe.operations : fallbackOperations(input);
  const fallback = !safe.operations?.length && Boolean(operations?.length) && wantsOperations(input);

  if (input.action === "prompt") {
    return {
      model,
      summary: safe.summary,
      operations,
      svg: safe.svg,
      fallback,
    };
  }

  return {
    model,
    summary: safe.summary,
    operations,
    fallback,
  };
}

export async function POST(request: Request) {
  try {
    const input = requestSchema.parse(await request.json());
    const output = await callOllama(input);
    return NextResponse.json({
      provider: "local-ollama",
      ...output,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Local AI request failed.",
      },
      { status: 400 }
    );
  }
}
