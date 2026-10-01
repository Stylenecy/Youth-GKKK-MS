import Link from "next/link";
import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";

/** Standard dashboard page header: kicker, title, count/meta, optional action. */
export function PageHeader({
  kicker,
  title,
  meta,
  action,
}: {
  kicker: string;
  title: string;
  meta?: string;
  action?: ReactNode;
}) {
  return (
    <header className="relative flex flex-col gap-4 border-b border-rule-soft pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0 flex-1">
        <p className="kicker">
          <span className="kicker-num">( {kicker} )</span>
        </p>
        <h1 className="section-heading mt-2.5 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          {title}
        </h1>
        {meta && (
          <p className="mt-1.5 text-sm text-ink-muted leading-relaxed">
            {meta}
          </p>
        )}
      </div>
      {action && <div className="flex shrink-0 items-center gap-2.5">{action}</div>}
    </header>
  );
}

/** Back link used on every detail page. */
export function BackLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="group inline-flex min-h-[44px] items-center gap-2 font-mono text-xs text-ink-faint transition-colors hover:text-accent"
    >
      <span aria-hidden="true" className="transition-transform group-hover:-translate-x-1">
        &larr;
      </span>
      <span>{children}</span>
    </Link>
  );
}

/** Honest empty state — says what is missing and what to do about it. */
export function EmptyState({
  title,
  body,
  icon: Icon,
  action,
}: {
  title: string;
  body: string;
  icon?: ElementType;
  action?: ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-dashed border-rule bg-canvas-sunk/60 px-6 py-12 text-center backdrop-blur-sm sm:px-12 sm:py-16">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(253,190,2,0.03),transparent_70%)]"
      />
      {Icon && (
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-rule-soft bg-surface text-ink-faint shadow-inner">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
      )}
      <p className="font-serif text-lg font-semibold text-ink sm:text-xl">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-muted">
        {body}
      </p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

/** Label/value pair used across detail pages. */
export function DataPoint({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="border-t border-rule-soft pt-3.5">
      <dt className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-ink-faint">
        ( {label} )
      </dt>
      <dd className="mt-1.5 text-[0.9375rem] font-medium text-ink leading-relaxed">
        {value}
      </dd>
    </div>
  );
}

/** Monogram stand-in for an avatar with warm Nocturne styling. */
export function Monogram({
  name,
  size = "md",
}: {
  name: string;
  size?: "sm" | "md" | "lg";
}) {
  const dim =
    size === "lg"
      ? "h-14 w-14 text-xl"
      : size === "sm"
      ? "h-8 w-8 text-xs"
      : "h-10 w-10 text-sm";
  return (
    <span
      aria-hidden="true"
      className={`${dim} flex shrink-0 items-center justify-center rounded-full border border-line/50 bg-gradient-to-b from-surface-2 to-canvas-sunk font-serif font-bold text-accent shadow-sm`}
    >
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

const PANEL_TONE = {
  default: "border-line/40 bg-surface/75 backdrop-blur-xl",
  accent: "border-line-accent/40 bg-surface/85 backdrop-blur-xl",
  warning: "border-warning/50 bg-warning-wash/40 backdrop-blur-xl",
  sunk: "border-rule-soft bg-canvas-sunk/60",
} as const;

/**
 * The one dashboard card. Every page used to hand-roll
 * `rounded-2xl border bg-surface/7x backdrop-blur…` with drifting values;
 * this keeps radius, border, padding and tone in one place.
 */
export function Panel({
  tone = "default",
  className = "",
  children,
  ...rest
}: {
  tone?: keyof typeof PANEL_TONE;
  className?: string;
  children: ReactNode;
} & Omit<ComponentPropsWithoutRef<"section">, "className" | "children">) {
  return (
    <section
      className={`rounded-2xl border p-5 shadow-sm sm:p-6 ${PANEL_TONE[tone]} ${className}`}
      {...rest}
    >
      {children}
    </section>
  );
}

/**
 * Section heading inside a Panel or between blocks: accent dot, mono
 * kicker, optional count/meta on the right and an optional action.
 * Pass `id` and point the Panel's aria-labelledby at it.
 */
export function SectionTitle({
  id,
  title,
  meta,
  action,
  tone = "accent",
}: {
  id?: string;
  title: string;
  meta?: ReactNode;
  action?: ReactNode;
  tone?: "accent" | "warning";
}) {
  const color = tone === "warning" ? "text-warning" : "text-accent";
  const dot = tone === "warning" ? "bg-warning" : "bg-accent";
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-rule-soft pb-3">
      <div className="flex min-w-0 items-center gap-2">
        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} aria-hidden="true" />
        <h2 id={id} className={`font-mono text-xs font-bold uppercase tracking-[0.2em] ${color}`}>
          ( {title} )
        </h2>
      </div>
      {(meta || action) && (
        <div className="flex items-center gap-3">
          {meta && <span className="font-mono text-xs text-ink-faint">{meta}</span>}
          {action}
        </div>
      )}
    </div>
  );
}
