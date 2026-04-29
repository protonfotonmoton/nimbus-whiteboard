"use client";

import { useRef, useCallback, useEffect, useState } from "react";
import { updateBoard } from "@/lib/boards";

export function useAutoSave(boardId: string, debounceMs = 2000) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saving, setSaving] = useState(false);

  const save = useCallback(
    (elements: readonly Record<string, unknown>[], appState: Record<string, unknown>) => {
      if (timerRef.current) clearTimeout(timerRef.current);

      timerRef.current = setTimeout(() => {
        setSaving(true);
        updateBoard(boardId, {
          excalidraw_data: { elements, appState: { viewBackgroundColor: appState.viewBackgroundColor } },
          element_count: elements.length,
        });
        setLastSaved(new Date());
        setSaving(false);
      }, debounceMs);
    },
    [boardId, debounceMs]
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { save, lastSaved, saving };
}
