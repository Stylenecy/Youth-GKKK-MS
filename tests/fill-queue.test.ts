import { describe, it, expect } from "vitest";
import {
  startFill,
  currentSlot,
  fillDone,
  fillSaved,
  fillSkipped,
  fillUndone,
  type SavedSlot,
} from "@/lib/fill-queue";

const saved = (name: string, role: SavedSlot["role"]): SavedSlot => ({
  assignmentId: `a-${name}`,
  profileId: `p-${name}`,
  name,
  role,
});

describe("isi berurutan", () => {
  it("walks the empty slots in order and ends after the last one", () => {
    let s = startFill(["Singer", "Usher", "Usher"]);
    expect(currentSlot(s)).toBe("Singer");
    s = fillSaved(s, saved("Benny", "Singer"));
    expect(currentSlot(s)).toBe("Usher");
    s = fillSkipped(s);
    expect(currentSlot(s)).toBe("Usher");
    s = fillSaved(s, saved("Caca", "Usher"));
    expect(fillDone(s)).toBe(true);
    expect(s.saved.map((x) => x.name)).toEqual(["Benny", "Caca"]);
  });

  it("does not mutate the queue it was started from", () => {
    const queue = ["WL", "Sound"] as const;
    const s = fillSaved(startFill(queue), saved("Dex", "WL"));
    expect(queue).toEqual(["WL", "Sound"]);
    expect(s.slots).toEqual(["WL", "Sound"]);
  });

  it("undo after the LAST save reopens that slot instead of staying done", () => {
    let s = startFill(["Singer"]);
    s = fillSaved(s, saved("Benny", "Singer"));
    expect(fillDone(s)).toBe(true);
    s = fillUndone(s);
    expect(fillDone(s)).toBe(false);
    expect(currentSlot(s)).toBe("Singer");
    expect(s.saved).toEqual([]);
  });

  it("undo mid-way puts the slot back in front of the current one", () => {
    let s = startFill(["WL", "Singer", "Usher"]);
    s = fillSaved(s, saved("Dex", "WL"));
    s = fillSaved(s, saved("Erica", "Singer"));
    expect(currentSlot(s)).toBe("Usher");
    s = fillUndone(s);
    expect(currentSlot(s)).toBe("Singer");
    expect(s.saved.map((x) => x.name)).toEqual(["Dex"]);
    s = fillSaved(s, saved("Grace", "Singer"));
    expect(currentSlot(s)).toBe("Usher");
  });

  it("undo with nothing saved changes nothing", () => {
    const s = startFill(["WL"]);
    expect(fillUndone(s)).toBe(s);
  });
});
