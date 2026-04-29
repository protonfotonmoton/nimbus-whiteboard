import type { DeviceClass } from "@/hooks/useDevice";

export function getUIOptions(device: DeviceClass) {
  const base = {
    canvasActions: {
      changeViewBackgroundColor: false as const,
      clearCanvas: true,
      export: false as const,
      loadScene: false as const,
      saveToActiveFile: false as const,
      toggleTheme: false as const,
      saveAsImage: false as const,
    },
  };

  if (device === "phone") {
    return {
      ...base,
      canvasActions: {
        ...base.canvasActions,
        clearCanvas: false as const,
      },
    };
  }

  return base;
}

export function getExcalidrawProps(device: DeviceClass) {
  return {
    gridModeEnabled: device === "desktop",
    zenModeEnabled: false,
    theme: "dark" as const,
    viewModeEnabled: false,
  };
}
