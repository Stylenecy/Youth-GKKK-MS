import Link from "next/link";
import type { ReactNode } from "react";

/** Standard dashboard page header: kicker, title, count, optional action. */
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
    <header className="flex flex-col gap-4 border-b border-rule pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="kicker">
          <span className="kicker-num">{kicker}</span>
        </p>
        <h1 className="section-heading mt-2.5 text-3xl">{title}</h1>
        {meta && <p className="mt-1.5 text-sm text-ink-muted">{meta}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}

/** Back link used on every detail page. */
export function BackLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-[44px] items-center gap-1.5 font-mono text-xs text-ink-faint transition-colors hover:text-ink"
    >
      <span aria-hidden="true">&larr;</span> {children}
    </Link>
  );
}

/** Honest empty state — says what is missing and what to do about it. */
export function EmptyState({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <div className="card-sunk px-6 py-12 text-center">
      <p className="font-serif text-lg font-semibold text-ink">{title}</p>
      <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-ink-muted">
        {body}
      </p>
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
    <div className="border-t border-rule-soft pt-3">
      <dt className="font-mono text-[0.625rem] uppercase tracking-[0.14em] text-ink-faint">
        {label}
      </dt>
      <dd className="mt-1 text-[0.9375rem] text-ink">{value}</dd>
    </div>
  );
}

/** Monogram stand-in for an avatar. Decorative — the name sits next to it. */
export function Monogram({
  name,
  size = "md",
}: {
  name: string;
  size?: "sm" | "md" | "lg";
}) {
  const dim =
    size === "lg" ? "h-14 w-14 text-xl" : size === "sm" ? "h-8 w-8 text-xs" : "h-10 w-10 text-sm";
  return (
    <span
      aria-hidden="true"
      className={`${dim} flex shrink-0 items-center justify-center rounded-full bg-canvas-sunk font-serif font-semibold text-ink-muted`}
    >
      {name.charAt(0).toUpperCase()}
    </span>
  );
}
