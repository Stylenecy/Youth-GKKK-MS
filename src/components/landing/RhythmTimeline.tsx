"use client";

import { useEffect, useRef, useState } from "react";
import { clamp, remap, useReducedMotion } from "@/lib/motion";
import Reveal from "@/components/landing/Reveal";

type RhythmItem = {
  day: string;
  time: string;
  title: string;
  note: string;
  highlight?: boolean;
};

type Props = {
  items: RhythmItem[];
};

export default function RhythmTimeline({ items }: Props) {
  const containerRef = useRef<HTMLOListElement>(null);
  const reduced = useReducedMotion();
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    if (reduced) return;
    const el = containerRef.current;
    if (!el) return;

    let frame: number | null = null;
    const measure = () => {
      frame = null;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || 800;
      // Progress 0 when container top is near 80% vh, 1 when bottom is near 30% vh
      const p = clamp(1 - (rect.top - vh * 0.3) / (rect.height + vh * 0.5));
      setScrollProgress(p);
    };

    const request = () => {
      if (frame === null) frame = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", request);
    return () => {
      window.removeEventListener("scroll", request);
      window.removeEventListener("resize", request);
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, [reduced]);

  const lineFill = reduced ? 1 : remap(scrollProgress, 0.05, 0.9);

  return (
    <ol ref={containerRef} className="relative flex flex-col gap-4">
      {/* Background track line */}
      <span
        aria-hidden="true"
        className="absolute left-[4.5rem] top-4 h-[calc(100%-2.5rem)] w-px bg-rule sm:left-[5.5rem]"
      />

      {/* Animated active fill line */}
      <span
        aria-hidden="true"
        className="absolute left-[4.5rem] top-4 h-[calc(100%-2.5rem)] w-0.5 bg-gradient-to-b from-accent via-accent-strong to-accent-wash transition-transform duration-75 sm:left-[5.5rem]"
        style={{
          transform: `scaleY(${lineFill})`,
          transformOrigin: "top center",
        }}
      />

      {items.map((r, i) => {
        const itemThreshold = i / Math.max(1, items.length - 1);
        const isActive = reduced || scrollProgress >= itemThreshold * 0.75;
        const indexStr = `0${i + 1}`;

        return (
          <Reveal
            as="li"
            key={`${r.day}-${r.time}`}
            delay={0.06 * i}
            className="group relative flex gap-4 sm:gap-6 items-start"
          >
            <div className="w-16 shrink-0 text-right sm:w-20 pt-3">
              <span className="block font-mono text-[0.625rem] uppercase tracking-[0.18em] text-ink-faint">
                {r.day}
              </span>
              <span className="num block font-serif text-xl font-semibold text-ink">
                {r.time}
              </span>
            </div>

            {/* Timeline node with breathing pulse */}
            <div className="relative flex items-center justify-center pt-4">
              {r.highlight && (
                <span
                  aria-hidden="true"
                  className="absolute h-6 w-6 rounded-full bg-accent/30 animate-ping opacity-75"
                />
              )}
              <span
                aria-hidden="true"
                className={`relative z-10 h-3.5 w-3.5 shrink-0 rounded-full transition-all duration-300 ring-4 ring-canvas-sunk ${
                  r.highlight
                    ? "bg-accent scale-110 shadow-[0_0_20px_rgba(253,190,2,0.9)]"
                    : isActive
                    ? "bg-accent-strong scale-100 shadow-[0_0_10px_rgba(253,190,2,0.4)]"
                    : "bg-rule scale-90"
                }`}
              />
            </div>

            {/* Luxury card */}
            <div
              className={`flex-1 rounded-xl p-4 sm:p-5 transition-all duration-300 ${
                r.highlight
                  ? "border border-line-accent bg-surface/90 shadow-[0_0_24px_rgba(253,190,2,0.12)]"
                  : "border border-line/50 bg-surface/40 hover:border-line hover:bg-surface/70 hover:shadow-md"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[0.6875rem] font-bold text-accent">
                  ( {indexStr} )
                </span>
                {r.highlight && (
                  <span className="tag tag-accent text-[0.625rem] py-0.5 px-2">
                    PUSAT RITME
                  </span>
                )}
              </div>
              <h3
                className={`mt-1 font-serif text-lg font-semibold transition-colors ${
                  r.highlight ? "text-accent" : "text-ink"
                }`}
              >
                {r.title}
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-ink-muted">
                {r.note}
              </p>
            </div>
          </Reveal>
        );
      })}
    </ol>
  );
}

