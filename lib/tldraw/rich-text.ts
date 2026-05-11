import type { TLRichText } from "tldraw";
import { toRichText } from "tldraw";

export function toNimbusRichText(text: string): TLRichText {
  return toRichText(text);
}

export function readNimbusPlainText(richText: unknown): string {
  if (!richText || typeof richText !== "object") return "";
  const root = richText as { content?: Array<{ content?: Array<{ text?: string }> }> };
  return (root.content || [])
    .map((paragraph) => (paragraph.content || []).map((node) => node.text || "").join(""))
    .join("\n")
    .trim();
}
