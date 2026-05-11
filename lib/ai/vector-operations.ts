import type { Editor, TLDefaultColorStyle, TLShape, TLShapeId, TLShapePartial } from "tldraw";
import { createShapeId } from "tldraw";
import { toNimbusRichText, readNimbusPlainText } from "@/lib/tldraw/rich-text";
import {
  vectorOperationBatchSchema,
  type VectorOperation,
  type VectorOperationBatch,
} from "@/lib/ai/operation-schema";
export { vectorOperationBatchSchema, vectorOperationSchema } from "@/lib/ai/operation-schema";
export type { VectorOperation, VectorOperationBatch } from "@/lib/ai/operation-schema";

const TL_COLOR_NAMES = new Set<TLDefaultColorStyle>([
  "black",
  "grey",
  "light-violet",
  "violet",
  "blue",
  "light-blue",
  "yellow",
  "orange",
  "green",
  "red",
]);

function normalizeColor(color?: string): TLDefaultColorStyle {
  return color && TL_COLOR_NAMES.has(color as TLDefaultColorStyle)
    ? (color as TLDefaultColorStyle)
    : "light-blue";
}

function sanitizeShapeId(id?: string): TLShapeId | undefined {
  if (!id) return undefined;
  if (id.startsWith("shape:")) return id as TLShapeId;
  return createShapeId(id.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 48));
}

function shapeIdForCreate(id?: string): TLShapeId {
  return sanitizeShapeId(id) || createShapeId();
}

function operationToShape(operation: Exclude<VectorOperation, { op: "delete_shapes" | "update_text" }>): TLShapePartial<TLShape> {
  if (operation.op === "create_text") {
    return {
      id: shapeIdForCreate(operation.id),
      type: "text",
      x: operation.x,
      y: operation.y,
      props: {
        color: "light-blue",
        size: "m",
        font: "draw",
        richText: toNimbusRichText(operation.text),
        autoSize: true,
        scale: 1,
        w: Math.max(160, operation.text.length * 8),
      },
    };
  }

  if (operation.op === "create_note") {
    return {
      id: shapeIdForCreate(operation.id),
      type: "note",
      x: operation.x,
      y: operation.y,
      props: {
        color: "yellow",
        size: "m",
        font: "draw",
        richText: toNimbusRichText(operation.text),
        scale: 1,
      },
    };
  }

  if (operation.op === "create_arrow") {
    const x = Math.min(operation.start.x, operation.end.x);
    const y = Math.min(operation.start.y, operation.end.y);
    return {
      id: shapeIdForCreate(operation.id),
      type: "arrow",
      x,
      y,
      props: {
        kind: "arc",
        color: "light-blue",
        fill: "none",
        dash: "draw",
        size: "m",
        arrowheadStart: "none",
        arrowheadEnd: "arrow",
        font: "draw",
        start: { x: operation.start.x - x, y: operation.start.y - y },
        end: { x: operation.end.x - x, y: operation.end.y - y },
        bend: 0,
        richText: toNimbusRichText(operation.text || ""),
        labelPosition: 0.5,
        scale: 1,
        elbowMidPoint: 0.5,
      },
    };
  }

  return {
    id: shapeIdForCreate(operation.id),
    type: "geo",
    x: operation.x,
    y: operation.y,
    props: {
      geo: operation.shape,
      color: normalizeColor(operation.color),
      fill: "none",
      dash: "draw",
      size: "m",
      w: operation.w,
      h: operation.h,
      richText: toNimbusRichText(operation.text || ""),
      font: "draw",
    },
  };
}

function resolveExistingIds(editor: Editor, ids: string[]): TLShapeId[] {
  const existing = new Set(editor.getCurrentPageShapes().map((shape) => shape.id));
  return ids
    .map((id) => sanitizeShapeId(id))
    .filter((id): id is TLShapeId => Boolean(id && existing.has(id)));
}

export function applyVectorOperations(editor: Editor, input: unknown) {
  const parsed = vectorOperationBatchSchema.parse(input);
  const createShapes: TLShapePartial<TLShape>[] = [];
  const updates: TLShapePartial<TLShape>[] = [];
  const deleteIds: TLShapeId[] = [];

  for (const operation of parsed.operations) {
    if (operation.op === "delete_shapes") {
      deleteIds.push(...resolveExistingIds(editor, operation.ids));
      continue;
    }

    if (operation.op === "update_text") {
      const id = sanitizeShapeId(operation.id);
      const shape = id ? editor.getShape(id) : null;
      if (!shape || !("richText" in shape.props)) continue;
      updates.push({
        id,
        type: shape.type,
        props: {
          richText: toNimbusRichText(operation.text),
        },
      } as TLShapePartial<TLShape>);
      continue;
    }

    createShapes.push(operationToShape(operation));
  }

  if (deleteIds.length) editor.deleteShapes(deleteIds);
  if (updates.length) editor.updateShapes(updates);
  if (createShapes.length) editor.createShapes(createShapes);

  return {
    created: createShapes.length,
    updated: updates.length,
    deleted: deleteIds.length,
  };
}

export function extractShapeText(shape: TLShape): string {
  if ("richText" in shape.props) return readNimbusPlainText(shape.props.richText);
  return "";
}

export function buildExplainBoardMarkdown(shapes: TLShape[]) {
  const text = shapes.map(extractShapeText).filter(Boolean);
  const counts = shapes.reduce<Record<string, number>>((acc, shape) => {
    acc[shape.type] = (acc[shape.type] || 0) + 1;
    return acc;
  }, {});
  return [
    "# Board Summary",
    "",
    `Shapes: ${shapes.length}`,
    `Shape mix: ${Object.entries(counts)
      .map(([type, count]) => `${type} ${count}`)
      .join(", ") || "none"}`,
    "",
    "## Text Captured",
    text.length ? text.map((item) => `- ${item}`).join("\n") : "- No text elements found.",
  ].join("\n");
}

export function buildDiagramOperationsFromSelection(shapes: TLShape[]): VectorOperationBatch {
  const source = shapes.length ? shapes : [];
  const text = source.map(extractShapeText).filter(Boolean).slice(0, 8);
  const labels = text.length ? text : ["Input", "AI Structure", "Actionable Output"];
  const operations: VectorOperation[] = [];
  labels.forEach((label, index) => {
    const x = index * 260;
    operations.push({
      op: "create_shape",
      id: `ai_node_${Date.now()}_${index}`,
      shape: "rectangle",
      x,
      y: -180,
      w: 200,
      h: 96,
      text: label,
      color: index === 1 ? "yellow" : "light-blue",
    });
    if (index > 0) {
      operations.push({
        op: "create_arrow",
        start: { x: x - 52, y: -132 },
        end: { x: x - 8, y: -132 },
      });
    }
  });
  return { operations };
}
