"use client";

import { useEffect, useRef } from "react";
import type { FireTier } from "./ember-engine";

type NavigatorHints = Navigator & {
  deviceMemory?: number;
  connection?: { saveData?: boolean };
};

/**
 * Which fire this device gets, or none.
 * - none: reduced motion, Data Saver, or a very weak phone (≤ 2 GB / ≤ 2
 *   cores) — the static crest and its CSS embers stay;
 * - lite: ≤ 4 GB or ≤ 4 cores (most budget Android phones);
 * - full: everything else (and is demoted to lite at runtime if slow).
 */
function pickTier(): FireTier | null {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return null;
  const nav = navigator as NavigatorHints;
  if (nav.connection?.saveData) return null;
  const mem = nav.deviceMemory ?? 8;
  const cores = nav.hardwareConcurrency || 8;
  if (mem <= 2 || cores <= 2) return null;
  return mem <= 4 || cores <= 4 ? "lite" : "full";
}

/**
 * Scroll-linked crest of embers (the v2 fire, brought back on 9 Oct at
 * Dex's request). Server markup is the static crest; this component only
 * adds the canvas on top once the stage is about a screen away, and hides
 * the static image after the first WebGL frame — by then the stage is still
 * below the fold, so the swap is never seen.
 *
 * Progress: 0 while the stage's top is at the bottom of the viewport,
 * 1 when its centre has risen just above the middle. Scrolling back
 * scatters the embers again.
 */
export default function FireCrest() {
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const tier = pickTier();
    if (!tier) return;

    let handle: { destroy: () => void } | null = null;
    let cancelled = false;

    const target = () => {
      const r = stage.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      return (vh - r.top) / (vh * 0.45 + r.height * 0.5);
    };

    const start = () => {
      import("./ember-engine")
        .then(({ createEmberCrest }) => {
          if (cancelled) return;
          handle = createEmberCrest(stage, {
            tier,
            target,
            onReady: () => stage.classList.add("is-lit"),
            onLost: () => stage.classList.remove("is-lit"),
          });
          stage.dataset.fire = handle ? tier : "off";
        })
        .catch(() => {
          // Chunk failed to load: the static crest stays.
        });
    };

    const near = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        near.disconnect();
        start();
      },
      { rootMargin: "100% 0px" }
    );
    near.observe(stage);

    return () => {
      cancelled = true;
      near.disconnect();
      handle?.destroy();
      stage.classList.remove("is-lit");
    };
  }, []);

  return (
    <div ref={stageRef} className="lp-fire" aria-hidden="true">
      <div className="lp-hero-bloom lp-fire-bloom" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/crest-384.webp"
        srcSet="/brand/crest-384.webp 384w, /brand/crest-768.webp 768w"
        sizes="(min-width: 1024px) 300px, 46vw"
        width={384}
        height={515}
        alt=""
        loading="lazy"
        decoding="async"
        className="lp-fire-still"
      />
    </div>
  );
}
