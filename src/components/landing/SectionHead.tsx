import type { ReactNode } from "react";

/**
 * Every band opens the same way: a hairline that draws itself, the section
 * number in gold, its name in brackets, and one piece of live metadata on
 * the right. The repetition is the point — it is what makes the page read
 * as one bulletin rather than a stack of templates.
 */
export default function SectionHead({
  n,
  label,
  right,
  tone = "canvas",
}: {
  n: string;
  label: string;
  right?: ReactNode;
  tone?: "canvas" | "deep";
}) {
  const accent = tone === "deep" ? "text-accent-on-deep" : "text-accent";
  const muted = tone === "deep" ? "text-on-deep-muted" : "text-ink-faint";
  return (
    <div>
      <span
        className={`lp-rule ${tone === "deep" ? "opacity-40" : ""}`}
        data-reveal="rule"
        style={tone === "deep" ? { background: "currentColor" } : undefined}
      />
      <div className="mt-4 flex items-baseline justify-between gap-4" data-reveal="fade">
        <p className={`lp-meta ${muted}`}>
          <span className={accent}>{n}</span>&nbsp;&nbsp;
          <span className="lp-bracket">{label}</span>
        </p>
        {right ? <p className={`lp-meta text-right ${muted}`}>{right}</p> : null}
      </div>
    </div>
  );
}
