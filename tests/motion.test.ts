import { describe, it, expect } from "vitest";
import { clamp, lerp, remap, easeInOut } from "@/lib/motion";

/**
 * The landing hero's choreography is entirely a function of one number
 * (scroll progress, 0..1). Testing the curves here means the acts can be
 * retimed with confidence, and it catches the class of mistake that is
 * invisible in a screenshot: an act that never reaches full opacity, two
 * acts visible at once, or a gap where the screen is blank.
 */

describe("clamp / lerp", () => {
  it("clamps to the given range", () => {
    expect(clamp(-3)).toBe(0);
    expect(clamp(4)).toBe(1);
    expect(clamp(0.42)).toBeCloseTo(0.42);
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it("interpolates endpoints exactly", () => {
    expect(lerp(10, 20, 0)).toBe(10);
    expect(lerp(10, 20, 1)).toBe(20);
    expect(lerp(10, 20, 0.5)).toBe(15);
  });
});

describe("remap", () => {
  it("holds the output floor before the input window", () => {
    expect(remap(0, 0.3, 0.6)).toBe(0);
    expect(remap(0.29, 0.3, 0.6)).toBe(0);
  });

  it("holds the output ceiling after the input window", () => {
    expect(remap(0.61, 0.3, 0.6)).toBe(1);
    expect(remap(1, 0.3, 0.6)).toBe(1);
  });

  it("ramps linearly inside the window", () => {
    expect(remap(0.45, 0.3, 0.6)).toBeCloseTo(0.5);
  });

  it("does not divide by zero on a degenerate window", () => {
    expect(remap(0.5, 0.4, 0.4)).toBe(0);
    expect(Number.isNaN(remap(0.5, 0.4, 0.4))).toBe(false);
  });

  it("supports a custom output range", () => {
    expect(remap(0.5, 0, 1, 100, 200)).toBeCloseTo(150);
  });
});

describe("easeInOut", () => {
  it("pins both ends and passes through the middle", () => {
    expect(easeInOut(0)).toBe(0);
    expect(easeInOut(1)).toBe(1);
    expect(easeInOut(0.5)).toBeCloseTo(0.5);
  });

  it("is monotonic", () => {
    let prev = -1;
    for (let t = 0; t <= 1.0001; t += 0.05) {
      const v = easeInOut(t);
      expect(v).toBeGreaterThanOrEqual(prev);
      prev = v;
    }
  });
});

/** The exact curves used by HeroCinematic. Kept in sync by hand — if the
 *  component's windows change, these numbers must change with them. */
const act1 = (p: number) => 1 - remap(p, 0.06, 0.34);
const act2 = (p: number) => remap(p, 0.16, 0.4) * (1 - remap(p, 0.58, 0.74));
const act3 = (p: number) => remap(p, 0.6, 0.82);
const gather = (p: number) => remap(p, 0.1, 0.72);

describe("hero choreography", () => {
  it("opens on act 1 alone", () => {
    expect(act1(0)).toBe(1);
    expect(act2(0)).toBe(0);
    expect(act3(0)).toBe(0);
  });

  it("closes on act 3 alone", () => {
    expect(act1(1)).toBe(0);
    expect(act2(1)).toBe(0);
    expect(act3(1)).toBe(1);
  });

  it("gives every act a moment at full strength", () => {
    expect(act1(0.02)).toBeCloseTo(1);
    expect(Math.max(act2(0.46), act2(0.5), act2(0.55))).toBeCloseTo(1, 2);
    expect(act3(0.9)).toBe(1);
  });

  it("never leaves the screen empty mid-scroll", () => {
    // Something must always be legible, or the hero reads as broken rather
    // than as cinematic. This is the assertion that caught the original
    // timing, where act 1 ended before act 2 had faded up.
    for (let p = 0; p <= 1.0001; p += 0.01) {
      const strongest = Math.max(act1(p), act2(p), act3(p));
      expect(strongest, `dead zone at progress ${p.toFixed(2)}`).toBeGreaterThan(
        0.3
      );
    }
  });

  it("has the crest essentially whole before the closing copy is readable", () => {
    // "Satu api, satu wadah" must not be legible while embers are still in
    // flight — the sentence is the payoff, not the narration.
    for (let p = 0; p <= 1.0001; p += 0.01) {
      if (act3(p) >= 0.5) {
        expect(gather(p), `copy readable at ${p.toFixed(2)}`).toBeGreaterThan(
          0.9
        );
      }
    }
  });

  it("keeps the crest assembling monotonically", () => {
    let prev = -1;
    for (let p = 0; p <= 1.0001; p += 0.05) {
      const g = gather(p);
      expect(g).toBeGreaterThanOrEqual(prev);
      prev = g;
    }
    expect(gather(0)).toBe(0);
    expect(gather(1)).toBe(1);
  });
});
