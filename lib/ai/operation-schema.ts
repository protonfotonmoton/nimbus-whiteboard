import { z } from "zod";

const pointSchema = z.object({
  x: z.number().finite(),
  y: z.number().finite(),
});

const createShapeSchema = z.object({
  op: z.literal("create_shape"),
  id: z.string().optional(),
  shape: z.enum(["rectangle", "ellipse", "diamond", "triangle", "cloud"]).default("rectangle"),
  x: z.number().finite(),
  y: z.number().finite(),
  w: z.number().finite().min(8).max(4000),
  h: z.number().finite().min(8).max(4000),
  text: z.string().max(2000).optional(),
  color: z.string().optional(),
});

const createTextSchema = z.object({
  op: z.literal("create_text"),
  id: z.string().optional(),
  x: z.number().finite(),
  y: z.number().finite(),
  text: z.string().min(1).max(4000),
});

const createNoteSchema = z.object({
  op: z.literal("create_note"),
  id: z.string().optional(),
  x: z.number().finite(),
  y: z.number().finite(),
  text: z.string().min(1).max(4000),
});

const createArrowSchema = z.object({
  op: z.literal("create_arrow"),
  id: z.string().optional(),
  start: pointSchema,
  end: pointSchema,
  text: z.string().max(1000).optional(),
});

const deleteShapesSchema = z.object({
  op: z.literal("delete_shapes"),
  ids: z.array(z.string()).max(100),
});

const updateTextSchema = z.object({
  op: z.literal("update_text"),
  id: z.string(),
  text: z.string().max(4000),
});

export const vectorOperationSchema = z.discriminatedUnion("op", [
  createShapeSchema,
  createTextSchema,
  createNoteSchema,
  createArrowSchema,
  deleteShapesSchema,
  updateTextSchema,
]);

export const vectorOperationBatchSchema = z.object({
  operations: z.array(vectorOperationSchema).max(80),
});

export type VectorOperation = z.infer<typeof vectorOperationSchema>;
export type VectorOperationBatch = z.infer<typeof vectorOperationBatchSchema>;
