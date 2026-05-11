"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Editor,
  Tldraw,
  serializeTldrawJson,
  type TLShape,
  type TLShapePartial,
} from "tldraw";
import { updateBoard, type Board } from "@/lib/boards";
import { legacyNimbusToTldrawShapes } from "@/lib/tldraw/legacy-import";
import {
  applyVectorOperations,
  extractShapeText,
  type VectorOperation,
} from "@/lib/ai/vector-operations";

interface NimbusTldrawCanvasProps {
  board: Board;
}

type StatusKind = "idle" | "success" | "error";
type AiAction = "clean_ink" | "diagram" | "explain" | "finish_sketch" | "generate_svg" | "prompt";

interface PendingAiResult {
  label: string;
  model?: string;
  summary?: string;
  operations?: VectorOperation[];
  svg?: string;
  fallback?: boolean;
  rawJson: string;
}

interface ShapeSummary {
  id: string;
  type: string;
  x: number;
  y: number;
  w?: number;
  h?: number;
  text?: string;
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function selectedOrAll(editor: Editor) {
  const selected = editor.getSelectedShapeIds();
  return selected.length ? selected : editor.getCurrentPageShapes().map((shape) => shape.id);
}

function getActiveShapes(editor: Editor): TLShape[] {
  const selected = editor.getSelectedShapes();
  return selected.length ? selected : editor.getCurrentPageShapes();
}

function readFileAsText(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export default function NimbusTldrawCanvas({ board }: NimbusTldrawCanvasProps) {
  const [editor, setEditor] = useState<Editor | null>(null);
  const [status, setStatus] = useState<{ kind: StatusKind; message: string }>({
    kind: "idle",
    message: "tldraw canvas ready",
  });
  const [summary, setSummary] = useState("");
  const [pendingAi, setPendingAi] = useState<PendingAiResult | null>(null);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isPromptOpen, setIsPromptOpen] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);

  const persistenceKey = useMemo(() => `nimbus-tldraw-${board.id}`, [board.id]);

  const setTemporaryStatus = useCallback((kind: StatusKind, message: string) => {
    setStatus({ kind, message });
    window.setTimeout(() => setStatus({ kind: "idle", message: "tldraw canvas ready" }), 3500);
  }, []);

  const importShapes = useCallback(
    (shapes: TLShapePartial<TLShape>[], source: string) => {
      if (!editor || shapes.length === 0) return;
      editor.createShapes(shapes);
      editor.zoomToFit();
      updateBoard(board.id, { element_count: editor.getCurrentPageShapes().length + shapes.length });
      setTemporaryStatus("success", `Imported ${shapes.length} ${source} shapes`);
    },
    [board.id, editor, setTemporaryStatus]
  );

  const handleMount = useCallback(
    (mountedEditor: Editor) => {
      setEditor(mountedEditor);
      mountedEditor.user.updateUserPreferences({ colorScheme: "dark" });

      const marker = `nimbus-tldraw-imported-${board.id}`;
      const legacyShapes = legacyNimbusToTldrawShapes(board.excalidraw_data);
      if (!window.localStorage.getItem(marker) && legacyShapes.length > 0) {
        mountedEditor.createShapes(legacyShapes);
        mountedEditor.zoomToFit();
        window.localStorage.setItem(marker, "true");
        updateBoard(board.id, { element_count: legacyShapes.length });
      }
    },
    [board.id, board.excalidraw_data]
  );

  useEffect(() => {
    if (!editor) return;
    const interval = window.setInterval(() => {
      updateBoard(board.id, { element_count: editor.getCurrentPageShapes().length });
    }, 2500);
    return () => window.clearInterval(interval);
  }, [board.id, editor]);

  // ── Nimbus Lens broadcast (Infinite Blueprint · intelligence loop) ──
  // When this whiteboard runs inside the Nimbusphere v2 dashboard iframe, it broadcasts
  // its canvas snapshot to the parent window so the dashboard can show a live JSON sidecar
  // (per founder inbox 22:12 · "as I'm drawing, show me the JSON in real time").
  // Throttled to ~250ms so heavy strokes don't flood postMessage. Same-origin safe via "*"
  // because both ends live on localhost during dev — tighten to a specific origin in prod.
  useEffect(() => {
    if (!editor) return;
    if (window.parent === window) return; // not in an iframe → nothing to broadcast
    let pending = false;
    const broadcast = () => {
      if (pending) return;
      pending = true;
      window.requestAnimationFrame(() => {
        pending = false;
        try {
          const shapes = editor.getCurrentPageShapes();
          const snapshot = {
            shapes: shapes.map((s) => ({
              id: s.id, type: s.type, x: s.x, y: s.y, rotation: s.rotation, props: s.props,
            })),
            count: shapes.length,
            ts: Date.now(),
          };
          window.parent.postMessage(
            { type: "lens.canvas.snapshot", strokeCount: shapes.length, data: snapshot },
            "*"
          );
        } catch {}
      });
    };
    const cleanup = editor.store.listen(broadcast, { source: "user", scope: "document" });
    broadcast(); // initial snapshot
    return () => { cleanup(); };
  }, [editor]);

  async function exportSvg() {
    if (!editor) return;
    const ids = selectedOrAll(editor);
    if (!ids.length) {
      setTemporaryStatus("error", "Nothing to export");
      return;
    }
    const output = await editor.getSvgString(ids, { background: true });
    if (!output) {
      setTemporaryStatus("error", "SVG export failed");
      return;
    }
    download(new Blob([output.svg], { type: "image/svg+xml" }), `${board.name}.svg`);
    setTemporaryStatus("success", `Exported ${ids.length} shape${ids.length === 1 ? "" : "s"} as SVG`);
  }

  async function exportPng() {
    if (!editor) return;
    const ids = selectedOrAll(editor);
    if (!ids.length) {
      setTemporaryStatus("error", "Nothing to export");
      return;
    }
    const output = await editor.toImage(ids, { format: "png", background: true });
    download(output.blob, `${board.name}.png`);
    setTemporaryStatus("success", `Exported ${ids.length} shape${ids.length === 1 ? "" : "s"} as PNG`);
  }

  async function exportJson() {
    if (!editor) return;
    const json = await serializeTldrawJson(editor);
    download(new Blob([json], { type: "application/json" }), `${board.name}.tldr.json`);
    setTemporaryStatus("success", "Exported tldraw JSON");
  }

  async function exportAiSvg() {
    if (!pendingAi?.svg) return;
    download(new Blob([pendingAi.svg], { type: "image/svg+xml" }), `${board.name}.ai.svg`);
    setTemporaryStatus("success", "Downloaded local AI SVG");
  }

  async function handleImportFile(file: File | undefined) {
    if (!file) return;
    try {
      const text = await readFileAsText(file);
      const parsed = JSON.parse(text);
      importShapes(legacyNimbusToTldrawShapes(parsed), "legacy Nimbus");
    } catch (error) {
      setTemporaryStatus("error", error instanceof Error ? error.message : "Import failed");
    } finally {
      if (importInputRef.current) importInputRef.current.value = "";
    }
  }

  function summarizeShapes(shapes: TLShape[]): ShapeSummary[] {
    if (!editor) return [];
    return shapes.map((shape) => {
      const bounds = editor.getShapePageBounds(shape);
      const text = extractShapeText(shape);
      return {
        id: shape.id,
        type: shape.type,
        x: shape.x,
        y: shape.y,
        w: bounds?.w,
        h: bounds?.h,
        text: text || undefined,
      };
    });
  }

  async function getCanvasSnapshot(ids: ReturnType<Editor["getSelectedShapeIds"]>) {
    if (!editor || ids.length === 0) return {};

    const [canvasJsonText, svgOutput, imageOutput] = await Promise.allSettled([
      serializeTldrawJson(editor),
      editor.getSvgString(ids, { background: true }),
      editor.toImage(ids, { format: "png", background: true }),
    ]);

    let canvasJson: unknown;
    if (canvasJsonText.status === "fulfilled") {
      try {
        canvasJson = JSON.parse(canvasJsonText.value);
      } catch {
        canvasJson = canvasJsonText.value;
      }
    }

    let screenshotDataUrl: string | undefined;
    if (imageOutput.status === "fulfilled" && imageOutput.value.blob.size <= 1_400_000) {
      screenshotDataUrl = await blobToDataUrl(imageOutput.value.blob);
    }

    return {
      canvasJson,
      svg: svgOutput.status === "fulfilled" ? svgOutput.value?.svg : undefined,
      screenshotDataUrl,
    };
  }

  async function requestLocalAi(action: AiAction, label: string, customPrompt?: string) {
    if (!editor) return;

    const activeShapes = getActiveShapes(editor);
    const ids = selectedOrAll(editor);
    const prompt = customPrompt?.trim();

    if (!activeShapes.length && action !== "explain") {
      setTemporaryStatus("error", "Add or select something first");
      return;
    }

    if (action === "prompt" && !prompt) {
      setTemporaryStatus("error", "Write a prompt first");
      return;
    }

    setPendingAi(null);
    setStatus({ kind: "idle", message: `Asking your local AI: ${label}` });

    try {
      const snapshot = await getCanvasSnapshot(ids);
      const response = await fetch("/api/ai/whiteboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          boardName: board.name,
          prompt,
          shapes: summarizeShapes(activeShapes),
          ...snapshot,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Local AI request failed");

      const operations = Array.isArray(data.operations) ? data.operations : undefined;
      const result: PendingAiResult = {
        label,
        model: data.model,
        summary: data.summary,
        operations,
        svg: data.svg,
        fallback: Boolean(data.fallback),
        rawJson: JSON.stringify(
          {
            provider: data.provider,
            model: data.model,
            summary: data.summary,
            operations,
            svg: data.svg,
            fallback: Boolean(data.fallback),
          },
          null,
          2
        ),
      };

      if (data.summary) setSummary(data.summary);
      if (operations?.length || data.svg || action === "prompt") {
        setPendingAi(result);
        setStatus({
          kind: "success",
          message: `${data.fallback ? "Safe fallback JSON ready" : "Local AI preview ready"}${
            data.model ? ` (${data.model})` : ""
          }`,
        });
      } else if (data.summary) {
        setStatus({
          kind: "success",
          message: `Local AI explained the board${data.model ? ` (${data.model})` : ""}`,
        });
      } else {
        setTemporaryStatus("error", "Local AI returned no usable output");
      }
    } catch (error) {
      setTemporaryStatus("error", error instanceof Error ? error.message : "Local AI failed");
    }
  }

  function applyPendingAi() {
    if (!editor || !pendingAi?.operations?.length) return;
    const result = applyVectorOperations(editor, { operations: pendingAi.operations });
    const total = result.created + result.updated + result.deleted;
    setPendingAi(null);
    setTemporaryStatus(
      "success",
      `Applied ${total} local AI operation${total === 1 ? "" : "s"}`
    );
  }

  return (
    <div className="nimbus-tldraw-root absolute inset-0">
      <Tldraw
        persistenceKey={persistenceKey}
        onMount={handleMount}
        options={{ maxPages: 1 }}
      />

      <div className="nimbus-ai-panel">
        <div className="nimbus-ai-panel__title">Nimbus AI Sketch</div>
        <div className="nimbus-ai-panel__prompt">
          <button
            type="button"
            className="nimbus-ai-panel__prompt-toggle"
            aria-expanded={isPromptOpen}
            onClick={() => setIsPromptOpen((open) => !open)}
          >
            <span>Ask Local AI</span>
            {aiPrompt ? <span className="nimbus-ai-panel__prompt-chip">draft</span> : null}
            <span className="nimbus-ai-panel__prompt-arrow" aria-hidden="true">
              &gt;
            </span>
          </button>
          {isPromptOpen && (
            <>
              <textarea
                value={aiPrompt}
                onChange={(event) => setAiPrompt(event.target.value)}
                placeholder="Ask your local AI what to do with this board..."
                aria-label="Local AI prompt"
              />
              <button onClick={() => requestLocalAi("prompt", "Custom Prompt", aiPrompt)}>
                Ask AI
              </button>
            </>
          )}
        </div>
        <div className="nimbus-ai-panel__grid">
          <button onClick={() => requestLocalAi("clean_ink", "Clean Ink")}>Clean Ink</button>
          <button onClick={() => requestLocalAi("finish_sketch", "Finish Sketch")}>Finish Sketch</button>
          <button onClick={() => requestLocalAi("diagram", "Diagram")}>Diagram</button>
          <button onClick={() => requestLocalAi("explain", "Explain")}>Explain</button>
          <button onClick={() => requestLocalAi("generate_svg", "Generate SVG")}>AI SVG</button>
          <button onClick={exportSvg}>Export SVG</button>
          <button onClick={exportPng}>PNG</button>
          <button onClick={exportJson}>JSON</button>
          <button onClick={() => importInputRef.current?.click()}>Import</button>
        </div>
        <div className={`nimbus-ai-panel__status nimbus-ai-panel__status--${status.kind}`}>
          {status.message}
        </div>
        {summary && (
          <textarea
            readOnly
            value={summary}
            className="nimbus-ai-panel__summary"
            aria-label="Board summary"
          />
        )}
        {pendingAi && (
          <div className="nimbus-ai-panel__preview">
            <div className="nimbus-ai-panel__preview-title">
              {pendingAi.label}
              {pendingAi.model ? ` / ${pendingAi.model}` : ""}
            </div>
            {pendingAi.operations?.length ? (
              <div className="nimbus-ai-panel__preview-copy">
                {pendingAi.operations.length} validated operation
                {pendingAi.operations.length === 1 ? "" : "s"} waiting.
              </div>
            ) : null}
            {pendingAi.svg ? (
              <div className="nimbus-ai-panel__preview-copy">SVG output is ready.</div>
            ) : null}
            {pendingAi.fallback ? (
              <div className="nimbus-ai-panel__preview-copy">
                Model returned no usable operations, so Nimbus generated safe fallback JSON.
              </div>
            ) : null}
            <textarea
              readOnly
              value={pendingAi.rawJson}
              className="nimbus-ai-panel__json"
              aria-label="AI JSON result"
            />
            <div className="nimbus-ai-panel__preview-actions">
              {pendingAi.operations?.length ? <button onClick={applyPendingAi}>Apply</button> : null}
              {pendingAi.svg ? <button onClick={exportAiSvg}>Download SVG</button> : null}
              <button onClick={() => setPendingAi(null)}>Cancel</button>
            </div>
          </div>
        )}
      </div>

      <input
        ref={importInputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(event) => handleImportFile(event.target.files?.[0])}
      />
    </div>
  );
}
