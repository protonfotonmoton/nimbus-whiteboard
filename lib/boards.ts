export interface Board {
  id: string;
  name: string;
  excalidraw_data: Record<string, unknown>;
  element_count: number;
  created_at: string;
  updated_at: string;
}

const STORAGE_KEY = "nimbus-whiteboard-boards";

function generateId(): string {
  return `board_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function loadBoards(): Board[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveBoards(boards: Board[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(boards));
}

export function listBoards(): Board[] {
  return loadBoards().sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );
}

export function getBoard(id: string): Board | null {
  return loadBoards().find((b) => b.id === id) ?? null;
}

export function createBoard(name?: string): Board {
  const boards = loadBoards();
  const board: Board = {
    id: generateId(),
    name: name || `Board ${boards.length + 1}`,
    excalidraw_data: {},
    element_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  boards.push(board);
  saveBoards(boards);
  return board;
}

export function updateBoard(
  id: string,
  data: Partial<Pick<Board, "name" | "excalidraw_data" | "element_count">>
): Board | null {
  const boards = loadBoards();
  const idx = boards.findIndex((b) => b.id === id);
  if (idx === -1) return null;
  boards[idx] = {
    ...boards[idx],
    ...data,
    updated_at: new Date().toISOString(),
  };
  saveBoards(boards);
  return boards[idx];
}

export function deleteBoard(id: string): boolean {
  const boards = loadBoards();
  const filtered = boards.filter((b) => b.id !== id);
  if (filtered.length === boards.length) return false;
  saveBoards(filtered);
  return true;
}
