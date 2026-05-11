"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";
import { useDevice } from "@/hooks/useDevice";
import { useAutoSave } from "@/hooks/useAutoSave";
import { getUIOptions, getExcalidrawProps } from "@/lib/excalidraw/config";
import { NIMBUS_EXCALIDRAW_THEME, SEED_ELEMENT } from "@/lib/excalidraw/theme";
import type { ExcalidrawElement, AppState, BinaryFiles } from "@/lib/types";

const ExcalidrawWrapper = dynamic(
  async () => {
    const mod = await import("@excalidraw/excalidraw");
    return mod.Excalidraw;
  },
  { ssr: false, loading: () => <CanvasLoader /> }
);

function CanvasLoader() {
  return (
    <div className="flex items-center justify-center h-full w-full bg-nimbus-bg">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-nimbus-orange border-t-transparent rounded-full animate-spin" />
        <span className="text-nimbus-text-muted text-sm">Loading canvas...</span>
      </div>
    </div>
  );
}

interface CanvasProps {
  boardId: string;
  initialData?: {
    elements?: readonly ExcalidrawElement[];
    appState?: Partial<AppState>;
  };
  onExport?: (elements: readonly ExcalidrawElement[]) => void;
}

export default function Canvas({ boardId, initialData }: CanvasProps) {
  const device = useDevice();
  const { save, lastSaved, saving } = useAutoSave(boardId);
  const [elementCount, setElementCount] = useState(0);

  const handleChange = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (elements: readonly ExcalidrawElement[], appState: AppState, _files: BinaryFiles) => {
      const visibleElements = elements.filter((el) => !el.isDeleted);
      setElementCount(visibleElements.length);
      save(
        visibleElements as readonly Record<string, unknown>[],
        appState as unknown as Record<string, unknown>
      );
    },
    [save]
  );

  const uiOptions = getUIOptions(device);
  const excalidrawProps = getExcalidrawProps(device);

  // Excalidraw renders a massive welcome screen when elements is empty.
  // Seed with an invisible off-screen element to prevent it.
  const incomingElements = initialData?.elements;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const elements: any[] = (incomingElements && incomingElements.length > 0)
    ? Array.from(incomingElements)
    : [SEED_ELEMENT];

  return (
    <div className="excalidraw-container absolute inset-0">
      <ExcalidrawWrapper
        initialData={{
          elements,
          appState: {
            ...NIMBUS_EXCALIDRAW_THEME,
            ...(initialData?.appState || {}),
          },
        }}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onChange={handleChange as any}
        UIOptions={uiOptions}
        {...excalidrawProps}
      />

      {/* Status bar */}
      <div className="absolute bottom-3 left-3 flex items-center gap-3 text-xs text-nimbus-text-muted pointer-events-none z-10">
        <span>{elementCount} elements</span>
        {saving && <span className="text-nimbus-orange">Saving...</span>}
        {!saving && lastSaved && (
          <span>
            Saved {lastSaved.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        )}
      </div>
    </div>
  );
}
