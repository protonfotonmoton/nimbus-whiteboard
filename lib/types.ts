// Local type definitions to avoid fragile Excalidraw internal imports

export interface ExcalidrawElement {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  text?: string;
  isDeleted?: boolean;
  strokeColor?: string;
  backgroundColor?: string;
  startBinding?: { elementId: string } | null;
  endBinding?: { elementId: string } | null;
  boundElements?: Array<{ id: string; type: string }>;
  [key: string]: unknown;
}

export interface AppState {
  viewBackgroundColor?: string;
  [key: string]: unknown;
}

export interface BinaryFiles {
  [key: string]: unknown;
}
