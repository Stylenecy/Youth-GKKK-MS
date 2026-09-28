import { describe, expect, it } from "vitest";
import {
  FATIGUE_THRESHOLD,
  FATIGUE_WINDOW_DAYS,
  isOverloaded,
} from "../src/lib/fatigue";

describe("ambang beban pelayanan (keputusan Dex 28 Sep 2026: >2x/30 hari)", () => {
  it("threshold adalah 2 dalam jendela 30 hari", () => {
    expect(FATIGUE_THRESHOLD).toBe(2);
    expect(FATIGUE_WINDOW_DAYS).toBe(30);
  });

  it("0–2x belum overload", () => {
    expect(isOverloaded(0)).toBe(false);
    expect(isOverloaded(1)).toBe(false);
    expect(isOverloaded(2)).toBe(false);
  });

  it("3x ke atas overload", () => {
    expect(isOverloaded(3)).toBe(true);
    expect(isOverloaded(13)).toBe(true);
  });
});
