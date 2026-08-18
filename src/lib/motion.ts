"use client";

import { useEffect, useRef, useState } from "react";

/** Clamp v into [lo, hi]. */
export function clamp(v: number, lo = 0, hi = 1) {
  return Math.max(lo, Math.min(hi, v));
}

/** Linear interpolate a..b by t. */
export function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

/**
 * Map v from [inMin, inMax] onto [outMin, outMax], clamped at both ends.
 * The workhorse for scroll choreography: "between 30% and 60% scrolled,
 * move this from 0 to 1".
 */
export function remap(
  v: number,
  inMin: number,
  inMax: number,
  outMin = 0,
  outMax = 1
) {
  if (inMax === inMin) return outMin;
  return lerp(outMin, outMax, clamp((v - inMin) / (inMax - inMin)));
}

/** Smoothstep easing — no library needed for the one curve we actually use. */
export function easeInOut(t: number) {
  const x = clamp(t);
  return x * x * (3 - 2 * x);
}

/**
 * Does this visitor want motion reduced?
 *
 * Returns `true` until the media query has been read, so the first paint is
 * always the calm one. Getting this backwards means someone who asked for
 * less motion still catches a full animation on load, which is the whole
 * thing the setting exists to prevent.
 */
export function useReducedMotion() {
  const [reduced, setReduced] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return reduced;
}

/**
 * Progress (0..1) of a tall section as it scrolls past a sticky viewport.
 *
 * 0 = the section's top just reached the top of the screen,
 * 1 = its bottom is about to leave.
 *
 * Reads layout inside rAF rather than on the scroll event itself, so a fast
 * scroll coalesces into one measurement per frame instead of thrashing
 * layout on every wheel tick.
 */
export function useScrollProgress(ref: React.RefObject<HTMLElement | null>) {
  const [progress, setProgress] = useState(0);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const measure = () => {
      frame.current = null;
      const rect = el.getBoundingClientRect();
      const scrollable = rect.height - window.innerHeight;
      if (scrollable <= 0) {
        setProgress(rect.top <= 0 ? 1 : 0);
        return;
      }
      setProgress(clamp(-rect.top / scrollable));
    };

    const request = () => {
      if (frame.current === null) frame.current = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", request);
    return () => {
      window.removeEventListener("scroll", request);
      window.removeEventListener("resize", request);
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
  }, [ref]);

  return progress;
}

/** Fires once when the element first scrolls into view. */
export function useInView<T extends HTMLElement>(
  ref: React.RefObject<T | null>,
  rootMargin = "-12% 0px"
) {
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setSeen(true);
          io.disconnect();
        }
      },
      { rootMargin }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, rootMargin, seen]);

  return seen;
}
