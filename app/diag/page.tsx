"use client";

// Lightweight diagnostic — zero dependencies, no canvas, no fonts.
// If this times out, the issue is network/cache/CDN, not app code.
// If it renders but shows red flags, we know exactly what to fix.

import { useEffect, useState } from "react";

interface Diag {
  ts: string;
  ua: string;
  screen: string;
  innerSize: string;
  dpr: number;
  pointerCoarse: boolean;
  ontouchstart: boolean;
  maxTouchPoints: number;
  online: boolean;
  cookieEnabled: boolean;
  localStorageOK: string;
  storageBoardsCount: string;
  reactMounted: string;
  loadTimings: string;
  errors: string[];
  buildCommit: string;
}

export default function Diag() {
  const [d, setD] = useState<Diag | null>(null);
  const [tickCount, setTickCount] = useState(0);

  useEffect(() => {
    const errors: string[] = [];
    let storageOK = "unknown";
    let boardCount = "unknown";

    try {
      const probe = `__diag_${Date.now()}`;
      localStorage.setItem(probe, "1");
      localStorage.removeItem(probe);
      storageOK = "yes";
      try {
        const raw = localStorage.getItem("nimbus-whiteboard-boards");
        const arr = raw ? JSON.parse(raw) : [];
        boardCount = String(Array.isArray(arr) ? arr.length : "not-array");
      } catch (e) {
        boardCount = `parse-error: ${e instanceof Error ? e.message : String(e)}`;
      }
    } catch (e) {
      storageOK = `BLOCKED: ${e instanceof Error ? e.message : String(e)}`;
    }

    let timings = "n/a";
    try {
      const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
      if (nav) {
        timings = `dns ${(nav.domainLookupEnd - nav.domainLookupStart).toFixed(0)}ms · tcp ${(nav.connectEnd - nav.connectStart).toFixed(0)}ms · ttfb ${(nav.responseStart - nav.requestStart).toFixed(0)}ms · dom ${(nav.domContentLoadedEventEnd - nav.startTime).toFixed(0)}ms · load ${(nav.loadEventEnd - nav.startTime).toFixed(0)}ms`;
      }
    } catch (e) {
      timings = `err: ${e instanceof Error ? e.message : String(e)}`;
    }

    const onErr = (ev: ErrorEvent) => {
      errors.push(`${ev.message} @ ${ev.filename}:${ev.lineno}`);
      setD((prev) => (prev ? { ...prev, errors: [...prev.errors] } : prev));
    };
    window.addEventListener("error", onErr);

    setD({
      ts: new Date().toISOString(),
      ua: navigator.userAgent,
      screen: `${screen.width}x${screen.height}`,
      innerSize: `${window.innerWidth}x${window.innerHeight}`,
      dpr: window.devicePixelRatio || 1,
      pointerCoarse: window.matchMedia("(pointer: coarse)").matches,
      ontouchstart: "ontouchstart" in window,
      maxTouchPoints: navigator.maxTouchPoints || 0,
      online: navigator.onLine,
      cookieEnabled: navigator.cookieEnabled,
      localStorageOK: storageOK,
      storageBoardsCount: boardCount,
      reactMounted: "yes",
      loadTimings: timings,
      errors,
      buildCommit: "6899a03+",
    });

    return () => window.removeEventListener("error", onErr);
  }, []);

  // visible heartbeat — proves the JS bundle hydrated and is running
  useEffect(() => {
    const id = setInterval(() => setTickCount((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const row = (k: string, v: string | number | boolean | null | undefined, flag?: boolean) => (
    <div style={{ display: "flex", padding: "8px 0", borderBottom: "1px solid #222", fontSize: 14 }}>
      <div style={{ flex: "0 0 180px", color: "#888" }}>{k}</div>
      <div style={{ flex: 1, color: flag ? "#ff6b6b" : "#f0f0f0", wordBreak: "break-all" }}>{String(v)}</div>
    </div>
  );

  return (
    <div style={{ background: "#0a0a0a", color: "#f0f0f0", fontFamily: "ui-monospace,Menlo,Consolas,monospace", padding: 20, minHeight: "100dvh" }}>
      <h1 style={{ color: "#c9a84c", fontSize: 22, margin: "0 0 4px 0" }}>Nimbus Whiteboard — Diagnostic</h1>
      <div style={{ color: "#666", fontSize: 12, marginBottom: 16 }}>
        Heartbeat tick #{tickCount} — if this number is going up, JS is running.
      </div>

      {!d ? (
        <div style={{ color: "#ff6b6b", padding: 12, background: "#1a0a0a", border: "1px solid #ff6b6b", borderRadius: 8 }}>
          React mounted but useEffect did not run within ~50ms. If you see this for more than a second, JS is slow or stuck.
        </div>
      ) : (
        <>
          {row("timestamp", d.ts)}
          {row("user agent", d.ua)}
          {row("screen", d.screen)}
          {row("inner window", d.innerSize)}
          {row("device pixel ratio", d.dpr)}
          {row("pointer:coarse", d.pointerCoarse, !d.pointerCoarse)}
          {row("ontouchstart", d.ontouchstart, !d.ontouchstart)}
          {row("maxTouchPoints", d.maxTouchPoints)}
          {row("online", d.online, !d.online)}
          {row("cookies", d.cookieEnabled, !d.cookieEnabled)}
          {row("localStorage", d.localStorageOK, !d.localStorageOK.startsWith("yes"))}
          {row("boards in storage", d.storageBoardsCount)}
          {row("React mounted", d.reactMounted)}
          {row("load timings", d.loadTimings)}
          {row("build", d.buildCommit)}
          {row("JS errors", d.errors.length === 0 ? "none" : d.errors.join(" || "), d.errors.length > 0)}
        </>
      )}

      <div style={{ marginTop: 24, padding: 12, background: "#111", borderRadius: 8 }}>
        <div style={{ fontSize: 13, color: "#888", marginBottom: 8 }}>Quick links — tap to test:</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <a href="/" style={{ color: "#00d4ff", padding: 10, background: "#0d1117", borderRadius: 6, textDecoration: "none" }}>→ Home (board list)</a>
          <a href="/api/health" style={{ color: "#00d4ff", padding: 10, background: "#0d1117", borderRadius: 6, textDecoration: "none" }}>→ /api/health</a>
        </div>
      </div>

      <div style={{ marginTop: 16, color: "#555", fontSize: 11 }}>
        Send a screenshot of this page. Anything in red is a problem.
      </div>
    </div>
  );
}
