"use client";

import { useRef } from "react";
import { useInView } from "@/lib/motion";

/**
 * Resolve out of a haze once scrolled into view.
 *
 * Deliberately not a library: one IntersectionObserver and two CSS
 * properties. The `.blur-in` keyframe is already neutralised by the global
 * reduced-motion block, so there is nothing extra to opt out of here.
 */
export default function Reveal({
  children,
  delay = 0,
  as: Tag = "div",
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  as?: "div" | "section" | "li" | "article";
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const seen = useInView(ref);

  return (
    <Tag
      ref={ref as never}
      className={className}
      style={{
        opacity: seen ? undefined : 0,
        animation: seen
          ? `blur-in .9s cubic-bezier(.16,1,.3,1) ${delay}s both`
          : undefined,
      }}
    >
      {children}
    </Tag>
  );
}
