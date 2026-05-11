import type { TLDefaultColorStyle, TLShapePartial, TLShape, IndexKey } from "tldraw";
import { createShapeId } from "tldraw";
import { toNimbusRichText } from "@/lib/tldraw/rich-text";

type LegacyPoint = [number, number];

interface LegacyElement {
  type: string;
  color?: string;
  width?: number;
  x?: number;
  y?: number;
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
  text?: string;
  size?: number;
  points?: LegacyPoint[];
}

interface LegacyBoardData {
  pages?: LegacyElement[][];
}

const TL_COLORS = [
  { name: "black", value: "#1d1d1d" },
  { name: "grey", value: "#9ca3af" },
  { name: "light-violet", value: "#a855f7" },
  { name: "violet", value: "#7c3aed" },
  { name: "blue", value: "#2563eb" },
  { name: "light-blue", value: "#00d4ff" },
  { name: "yellow", value: "#f5c842" },
  { name: "orange", value: "#f59e0b" },
  { name: "green", value: "#22c55e" },
  { name: "red", value: "#ef4444" },
] as const;

function colorToTldraw(color?: string): TLDefaultColorStyle {
  if (!color) return "grey";
  const lower = color.toLowerCase();
  if (lower === "#ffffff" || lower === "white") return "grey";
  let best: (typeof TL_COLORS)[number] = TL_COLORS[0];
  let bestDistance = Number.POSITIVE_INFINITY;
  const rgb = parseHex(lower);
  if (!rgb) return "grey";
  for (const candidate of TL_COLORS) {
    const value = parseHex(candidate.value);
    if (!value) continue;
    const distance =
      Math.abs(rgb.r - value.r) + Math.abs(rgb.g - value.g) + Math.abs(rgb.b - value.b);
    if (distance < bestDistance) {
      best = candidate;
      bestDistance = distance;
    }
  }
  return best.name;
}

function parseHex(color: string): { r: number; g: number; b: number } | null {
  const match = color.match(/^#?([0-9a-f]{6})$/i);
  if (!match) return null;
  const value = match[1];
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16),
  };
}

function boundsFromCorners(element: LegacyElement) {
  const x1 = Number(element.x1 ?? element.x ?? 0);
  const y1 = Number(element.y1 ?? element.y ?? 0);
  const x2 = Number(element.x2 ?? x1 + 160);
  const y2 = Number(element.y2 ?? y1 + 96);
  return {
    x: Math.min(x1, x2),
    y: Math.min(y1, y2),
    w: Math.max(16, Math.abs(x2 - x1)),
    h: Math.max(16, Math.abs(y2 - y1)),
  };
}

function linePoints(points: LegacyPoint[]): Record<string, { id: string; index: IndexKey; x: number; y: number }> {
  return points.reduce<Record<string, { id: string; index: IndexKey; x: number; y: number }>>(
    (acc, point, index) => {
      const id = `p${index + 1}`;
      acc[id] = {
        id,
        index: `a${String(index + 1).padStart(4, "0")}` as IndexKey,
        x: point[0] - points[0][0],
        y: point[1] - points[0][1],
      };
      return acc;
    },
    {}
  );
}

function legacyElementToShape(element: LegacyElement): TLShapePartial<TLShape> | null {
  const color = colorToTldraw(element.color);

  if (element.type === "text" && element.text) {
    return {
      id: createShapeId(),
      type: "text",
      x: Number(element.x ?? 0),
      y: Number(element.y ?? 0),
      props: {
        color,
        size: "m",
        font: "draw",
        richText: toNimbusRichText(element.text),
        autoSize: true,
        scale: 1,
        w: Math.max(140, element.text.length * 8),
      },
    };
  }

  if (element.type === "sticky" && element.text) {
    return {
      id: createShapeId(),
      type: "note",
      x: Number(element.x ?? 0),
      y: Number(element.y ?? 0),
      props: {
        color: "yellow",
        size: "m",
        font: "draw",
        richText: toNimbusRichText(element.text),
        scale: 1,
      },
    };
  }

  if (element.type === "rect") {
    const box = boundsFromCorners(element);
    return {
      id: createShapeId(),
      type: "geo",
      x: box.x,
      y: box.y,
      props: {
        geo: "rectangle",
        color,
        fill: "none",
        dash: "draw",
        size: "m",
        w: box.w,
        h: box.h,
        richText: toNimbusRichText(""),
        font: "draw",
      },
    };
  }

  if (element.type === "circle") {
    const box = boundsFromCorners(element);
    return {
      id: createShapeId(),
      type: "geo",
      x: box.x,
      y: box.y,
      props: {
        geo: "ellipse",
        color,
        fill: "none",
        dash: "draw",
        size: "m",
        w: box.w,
        h: box.h,
        richText: toNimbusRichText(""),
        font: "draw",
      },
    };
  }

  if (element.type === "arrow") {
    const box = boundsFromCorners(element);
    return {
      id: createShapeId(),
      type: "arrow",
      x: box.x,
      y: box.y,
      props: {
        kind: "arc",
        color,
        fill: "none",
        dash: "draw",
        size: "m",
        arrowheadStart: "none",
        arrowheadEnd: "arrow",
        font: "draw",
        start: { x: Number(element.x1 ?? 0) - box.x, y: Number(element.y1 ?? 0) - box.y },
        end: { x: Number(element.x2 ?? 0) - box.x, y: Number(element.y2 ?? 0) - box.y },
        bend: 0,
        richText: toNimbusRichText(""),
        labelPosition: 0.5,
        scale: 1,
        elbowMidPoint: 0.5,
      },
    };
  }

  if (element.type === "line") {
    const start: LegacyPoint = [Number(element.x1 ?? 0), Number(element.y1 ?? 0)];
    const end: LegacyPoint = [Number(element.x2 ?? start[0]), Number(element.y2 ?? start[1])];
    return {
      id: createShapeId(),
      type: "line",
      x: start[0],
      y: start[1],
      props: {
        color,
        dash: "draw",
        size: "m",
        spline: "line",
        points: linePoints([start, end]),
        scale: 1,
      },
    };
  }

  if (element.type === "pen" && element.points && element.points.length > 1) {
    return {
      id: createShapeId(),
      type: "line",
      x: element.points[0][0],
      y: element.points[0][1],
      props: {
        color,
        dash: "draw",
        size: "m",
        spline: "cubic",
        points: linePoints(element.points.filter((_, index) => index % 3 === 0).slice(0, 96)),
        scale: 1,
      },
    };
  }

  return null;
}

export function legacyNimbusToTldrawShapes(data: unknown): TLShapePartial<TLShape>[] {
  const board = data as LegacyBoardData;
  const pages = Array.isArray(board.pages) ? board.pages : [];
  return pages
    .flatMap((page, pageIndex) =>
      page.map((element) => ({
        ...element,
        x: typeof element.x === "number" ? element.x + pageIndex * 1200 : element.x,
        x1: typeof element.x1 === "number" ? element.x1 + pageIndex * 1200 : element.x1,
        x2: typeof element.x2 === "number" ? element.x2 + pageIndex * 1200 : element.x2,
        points: element.points?.map(([x, y]) => [x + pageIndex * 1200, y] as LegacyPoint),
      }))
    )
    .map(legacyElementToShape)
    .filter((shape): shape is TLShapePartial<TLShape> => Boolean(shape));
}
