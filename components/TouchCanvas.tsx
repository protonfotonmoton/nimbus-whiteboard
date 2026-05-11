"use client";

import { useRef, useState, useCallback, useEffect } from "react";

interface Point {
  x: number;
  y: number;
}

interface Stroke {
  points: Point[];
  color: string;
  width: number;
  tool: "pen" | "eraser";
}

interface TextNote {
  id: string;
  x: number;
  y: number;
  text: string;
}

type Tool = "pen" | "eraser" | "text" | "select" | "pan";

const COLORS = [
  "#f7f8f8", // white
  "#c9a84c", // gold
  "#00d4ff", // cyan
  "#ef4444", // red
  "#22c55e", // green
  "#a855f7", // purple
];

export default function TouchCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tool, setTool] = useState<Tool>("pen");
  const [color, setColor] = useState("#f7f8f8");
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Point[]>([]);
  const [textNotes, setTextNotes] = useState<TextNote[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showTextInput, setShowTextInput] = useState(false);
  const [textInputPos, setTextInputPos] = useState<Point>({ x: 0, y: 0 });
  const [textValue, setTextValue] = useState("");
  const [showColors, setShowColors] = useState(false);

  // Canvas offset for panning
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const lastPanRef = useRef<Point | null>(null);
  const lastPinchRef = useRef<number | null>(null);

  // Resize canvas to fill container
  useEffect(() => {
    function resize() {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;
      const dpr = window.devicePixelRatio || 1;
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.scale(dpr, dpr);
      redraw();
    }
    resize();
    const onOrient = () => setTimeout(resize, 100);
    window.addEventListener("resize", resize);
    window.addEventListener("orientationchange", onOrient);
    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("orientationchange", onOrient);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Redraw whenever strokes/offset/scale change
  useEffect(() => {
    redraw();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [strokes, offset, scale, textNotes]);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, w, h);

    // Draw grid
    ctx.save();
    ctx.translate(offset.x, offset.y);
    ctx.scale(scale, scale);

    const gridSize = 40;
    const startX = Math.floor(-offset.x / scale / gridSize) * gridSize - gridSize;
    const startY = Math.floor(-offset.y / scale / gridSize) * gridSize - gridSize;
    const endX = startX + (w / scale) + gridSize * 2;
    const endY = startY + (h / scale) + gridSize * 2;

    ctx.strokeStyle = "rgba(255,255,255,0.04)";
    ctx.lineWidth = 0.5 / scale;
    for (let x = startX; x < endX; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
      ctx.stroke();
    }
    for (let y = startY; y < endY; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
      ctx.stroke();
    }

    // Draw strokes
    for (const stroke of strokes) {
      if (stroke.points.length < 2) continue;
      ctx.beginPath();
      ctx.strokeStyle = stroke.tool === "eraser" ? "#0a0a0a" : stroke.color;
      ctx.lineWidth = stroke.tool === "eraser" ? stroke.width * 4 : stroke.width;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        const prev = stroke.points[i - 1];
        const curr = stroke.points[i];
        const mx = (prev.x + curr.x) / 2;
        const my = (prev.y + curr.y) / 2;
        ctx.quadraticCurveTo(prev.x, prev.y, mx, my);
      }
      ctx.stroke();
    }

    // Draw current stroke
    if (currentStroke.length > 1) {
      ctx.beginPath();
      ctx.strokeStyle = tool === "eraser" ? "#0a0a0a" : color;
      ctx.lineWidth = tool === "eraser" ? strokeWidth * 4 : strokeWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.moveTo(currentStroke[0].x, currentStroke[0].y);
      for (let i = 1; i < currentStroke.length; i++) {
        const prev = currentStroke[i - 1];
        const curr = currentStroke[i];
        const mx = (prev.x + curr.x) / 2;
        const my = (prev.y + curr.y) / 2;
        ctx.quadraticCurveTo(prev.x, prev.y, mx, my);
      }
      ctx.stroke();
    }

    // Draw text notes
    for (const note of textNotes) {
      ctx.font = "16px system-ui, sans-serif";
      ctx.fillStyle = "#f7f8f8";
      ctx.fillText(note.text, note.x, note.y);
    }

    ctx.restore();
  }, [strokes, currentStroke, offset, scale, color, strokeWidth, tool, textNotes]);

  function getCanvasPoint(clientX: number, clientY: number): Point {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (clientX - rect.left - offset.x) / scale,
      y: (clientY - rect.top - offset.y) / scale,
    };
  }

  function handleTouchStart(e: React.TouchEvent) {
    e.preventDefault();

    if (e.touches.length === 2) {
      // Pinch to zoom
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastPinchRef.current = Math.hypot(dx, dy);
      const mx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const my = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      lastPanRef.current = { x: mx, y: my };
      return;
    }

    if (tool === "pan") {
      lastPanRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      return;
    }

    if (tool === "text") {
      const pt = getCanvasPoint(e.touches[0].clientX, e.touches[0].clientY);
      setTextInputPos(pt);
      setShowTextInput(true);
      return;
    }

    if (tool === "pen" || tool === "eraser") {
      const pt = getCanvasPoint(e.touches[0].clientX, e.touches[0].clientY);
      setIsDrawing(true);
      setCurrentStroke([pt]);
    }
  }

  function handleTouchMove(e: React.TouchEvent) {
    e.preventDefault();

    if (e.touches.length === 2) {
      // Pinch zoom
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      if (lastPinchRef.current !== null) {
        const delta = dist / lastPinchRef.current;
        setScale((s) => Math.min(5, Math.max(0.2, s * delta)));
      }
      lastPinchRef.current = dist;

      // Two-finger pan
      const mx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const my = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      if (lastPanRef.current) {
        setOffset((o) => ({
          x: o.x + (mx - lastPanRef.current!.x),
          y: o.y + (my - lastPanRef.current!.y),
        }));
      }
      lastPanRef.current = { x: mx, y: my };
      return;
    }

    if (tool === "pan" && lastPanRef.current) {
      const dx = e.touches[0].clientX - lastPanRef.current.x;
      const dy = e.touches[0].clientY - lastPanRef.current.y;
      setOffset((o) => ({ x: o.x + dx, y: o.y + dy }));
      lastPanRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      return;
    }

    if (isDrawing && (tool === "pen" || tool === "eraser")) {
      const pt = getCanvasPoint(e.touches[0].clientX, e.touches[0].clientY);
      setCurrentStroke((prev) => [...prev, pt]);
      redraw();
    }
  }

  function handleTouchEnd(e: React.TouchEvent) {
    e.preventDefault();
    lastPinchRef.current = null;
    lastPanRef.current = null;

    if (isDrawing && currentStroke.length > 1) {
      setStrokes((prev) => [...prev, { points: currentStroke, color, width: strokeWidth, tool: tool as "pen" | "eraser" }]);
    }
    setCurrentStroke([]);
    setIsDrawing(false);
  }

  function addTextNote() {
    if (textValue.trim()) {
      setTextNotes((prev) => [
        ...prev,
        { id: `t_${Date.now()}`, x: textInputPos.x, y: textInputPos.y, text: textValue.trim() },
      ]);
    }
    setTextValue("");
    setShowTextInput(false);
  }

  function undo() {
    setStrokes((prev) => prev.slice(0, -1));
  }

  function clearAll() {
    setStrokes([]);
    setTextNotes([]);
  }

  const tools: { id: Tool; label: string; icon: string }[] = [
    { id: "pen", label: "Pen", icon: "✏️" },
    { id: "eraser", label: "Eraser", icon: "🧹" },
    { id: "text", label: "Text", icon: "T" },
    { id: "pan", label: "Pan", icon: "✋" },
  ];

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden bg-nimbus-bg">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 touch-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />

      {/* Bottom toolbar */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1 px-3 py-2 bg-[rgba(22,22,25,0.92)] backdrop-blur-xl border border-[rgba(255,255,255,0.08)] rounded-2xl z-20">
        {tools.map((t) => (
          <button
            key={t.id}
            onClick={() => { setTool(t.id); setShowColors(false); }}
            className={`w-11 h-11 flex items-center justify-center rounded-xl text-base transition-all ${
              tool === t.id
                ? "bg-nimbus-orange/20 text-nimbus-orange ring-1 ring-nimbus-orange/40"
                : "text-nimbus-text-muted active:bg-nimbus-elevated"
            }`}
          >
            {t.icon}
          </button>
        ))}

        <div className="w-px h-6 bg-[rgba(255,255,255,0.08)] mx-1" />

        {/* Color picker */}
        <button
          onClick={() => setShowColors(!showColors)}
          className="w-11 h-11 flex items-center justify-center rounded-xl active:bg-nimbus-elevated"
        >
          <div className="w-5 h-5 rounded-full border-2 border-[rgba(255,255,255,0.2)]" style={{ backgroundColor: color }} />
        </button>

        {/* Size */}
        <button
          onClick={() => setStrokeWidth((w) => w >= 8 ? 1 : w + 2)}
          className="w-11 h-11 flex items-center justify-center rounded-xl text-nimbus-text-muted active:bg-nimbus-elevated"
        >
          <div className="rounded-full bg-nimbus-text" style={{ width: strokeWidth * 2 + 4, height: strokeWidth * 2 + 4 }} />
        </button>

        <div className="w-px h-6 bg-[rgba(255,255,255,0.08)] mx-1" />

        {/* Undo */}
        <button
          onClick={undo}
          className="w-11 h-11 flex items-center justify-center rounded-xl text-nimbus-text-muted active:bg-nimbus-elevated text-sm"
        >
          ↩
        </button>

        {/* Clear */}
        <button
          onClick={clearAll}
          className="w-11 h-11 flex items-center justify-center rounded-xl text-nimbus-text-dim active:bg-red-500/20 text-xs"
        >
          ✕
        </button>
      </div>

      {/* Color palette popup */}
      {showColors && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-2 bg-[rgba(22,22,25,0.95)] backdrop-blur-xl border border-[rgba(255,255,255,0.08)] rounded-2xl z-30">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => { setColor(c); setShowColors(false); }}
              className={`w-9 h-9 rounded-full transition-transform ${color === c ? "ring-2 ring-nimbus-orange scale-110" : "active:scale-90"}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      )}

      {/* Text input overlay */}
      {showTextInput && (
        <div className="absolute inset-0 flex items-center justify-center z-40 bg-black/50">
          <div className="bg-nimbus-card border border-nimbus-border rounded-2xl p-4 w-[80vw] max-w-sm">
            <input
              autoFocus
              value={textValue}
              onChange={(e) => setTextValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTextNote()}
              placeholder="Type your note..."
              className="w-full bg-nimbus-bg border border-nimbus-border rounded-lg px-3 py-2.5 text-nimbus-text text-base outline-none focus:border-nimbus-orange"
            />
            <div className="flex gap-2 mt-3">
              <button
                onClick={addTextNote}
                className="flex-1 py-2 bg-nimbus-orange text-nimbus-bg rounded-lg text-sm font-medium active:scale-95"
              >
                Add
              </button>
              <button
                onClick={() => { setShowTextInput(false); setTextValue(""); }}
                className="flex-1 py-2 bg-nimbus-elevated text-nimbus-text-muted rounded-lg text-sm active:scale-95"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Element count */}
      <div className="absolute top-2 right-3 text-xs text-nimbus-text-dim z-10 pointer-events-none">
        {strokes.length + textNotes.length} elements
      </div>
    </div>
  );
}
