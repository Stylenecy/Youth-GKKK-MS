import type { StewardRole } from "./validation";

/**
 * "Isi berurutan" (Penatalayan di HP, 18 Okt 2026): one sheet walks through
 * a Saturday's empty slots. Pure state, so the order rules — save moves on,
 * skip moves on, undo puts the slot back in front — are tested without a
 * browser (tests/fill-queue.test.ts).
 */
export interface SavedSlot {
  assignmentId: string | null;
  profileId: string;
  name: string;
  role: StewardRole;
}

export interface FillState {
  slots: StewardRole[];
  pos: number;
  saved: SavedSlot[];
}

export const EMPTY_FILL: FillState = { slots: [], pos: 0, saved: [] };

export function startFill(queue: readonly StewardRole[]): FillState {
  return { slots: [...queue], pos: 0, saved: [] };
}

export function currentSlot(state: FillState): StewardRole | null {
  return state.slots[state.pos] ?? null;
}

export function fillDone(state: FillState): boolean {
  return state.pos >= state.slots.length;
}

export function fillSaved(state: FillState, entry: SavedSlot): FillState {
  return { ...state, pos: state.pos + 1, saved: [...state.saved, entry] };
}

export function fillSkipped(state: FillState): FillState {
  return { ...state, pos: state.pos + 1 };
}

/** Undo the last save: forget it and make its role the current slot again. */
export function fillUndone(state: FillState): FillState {
  const last = state.saved[state.saved.length - 1];
  if (!last) return state;
  const at = Math.min(state.pos, state.slots.length);
  return {
    slots: [...state.slots.slice(0, at), last.role, ...state.slots.slice(at)],
    pos: at,
    saved: state.saved.slice(0, -1),
  };
}
