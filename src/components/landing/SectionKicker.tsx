"use client";

import { useEffect, useRef, useState } from "react";
import { clamp, remap, useReducedMotion } from "@/lib/motion";

type Props = {
  number: string;
  title: string;
  className?: string;
  numberColorClass?: string;
  direction?: "left" | "right" | "center";
  align?: "left" | "right" | "center";
};

/**
 * Scroll-driven section number component with grand directional reveals.
 * Alternates from left, right, or center with luxury typography, watermark numerals,
 * and dynamic golden baseline expansion.
 */
export default function SectionKicker({
  number,
  title,
  className = "",
  numberColorClass = "text-accent",
  direction,
  align,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const [progress, setProgress] = useState(0);

  // Auto-detect direction if not explicitly provided:
  const isCenter = align === "center" || direction === "center";
  const resolvedDirection =
    direction ?? (isCenter ? "center" : parseInt(number, 10) % 2 === 0 ? "right" : "left");
  const isRight = resolvedDirection === "right";
  const alignment = align ?? (isCenter ? "center" : isRight ? "right" : "left");

  useEffect(() => {
    if (reduced) return;
    const el = containerRef.current;
    if (!el) return;

    let frame: number | null = null;
    const measure = () => {
      frame = null;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || 800;
      const p = clamp(1 - (rect.top - vh * 0.3) / (vh * 0.6));
      setProgress(p);
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

  // Motion physics
  const opacity = reduced ? 1 : remap(progress, 0, 0.7, 0.05, 1);
  const distance = isCenter ? 0 : isRight ? 48 : -48;
  const translateY = isCenter && !reduced ? (1 - remap(progress, 0, 0.75)) * 32 : 0;
  const translateX = isCenter || reduced ? 0 : (1 - remap(progress, 0, 0.75)) * distance;
  const scale = reduced ? 1 : remap(progress, 0, 0.8, 0.92, 1);
  const lineScaleX = reduced ? 1 : remap(progress, 0.1, 0.85);

  const alignClass =
    alignment === "center"
      ? "items-center text-center"
      : alignment === "right"
      ? "items-end text-right"
      : "items-start text-left";

  const transformOrigin =
    alignment === "center"
      ? "center center"
      : isRight
      ? "right center"
      : "left center";

  return (
    <div ref={containerRef} className={`relative flex flex-col gap-2 ${alignClass} ${className}`}>
      {/* Giant ambient watermark number behind */}
      <span
        aria-hidden="true"
        style={{
          opacity: reduced ? 0.04 : opacity * 0.08,
          transform: `translate(${translateX * 0.5}px, ${translateY * 0.5}px) scale(${scale})`,
          transformOrigin,
        }}
        className={`pointer-events-none absolute -top-8 select-none font-serif text-7xl font-bold tracking-tighter text-ink sm:-top-12 sm:text-8xl lg:-top-16 lg:text-9xl ${
          alignment === "center"
            ? "left-1/2 -translate-x-1/2"
            : isRight
            ? "-right-3"
            : "-left-3"
        }`}
      >
        {number}
      </span>

      {/* Main kicker title and numeral */}
      <div
        style={{
          opacity,
          transform: `translate(${translateX}px, ${translateY}px) scale(${scale})`,
          transformOrigin,
        }}
        className={`relative z-10 flex flex-wrap items-baseline gap-3 sm:gap-4 ${
          alignment === "center"
            ? "justify-center"
            : alignment === "right"
            ? "flex-row-reverse"
            : "flex-row"
        }`}
      >
        <span
          className={`font-mono text-2xl font-black tracking-tight sm:text-3xl lg:text-4xl ${numberColorClass}`}
        >
          ( {number} )
        </span>
        <span className="font-mono text-xs font-semibold uppercase tracking-[0.26em] text-ink-muted sm:text-sm">
          {title}
        </span>
      </div>

      {/* Animated expanding golden baseline */}
      <div
        aria-hidden="true"
        className={`h-0.5 ${
          alignment === "center"
            ? "w-32 bg-gradient-to-r from-transparent via-accent to-transparent"
            : isRight
            ? "w-24 bg-gradient-to-l from-accent to-transparent"
            : "w-24 bg-gradient-to-r from-accent to-transparent"
        } rounded-full`}
        style={{
          transform: `scaleX(${lineScaleX})`,
          transformOrigin,
          opacity: reduced ? 0.7 : opacity * 0.9,
        }}
      />
    </div>
  );
}


