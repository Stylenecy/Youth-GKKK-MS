import Link from "next/link";
import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";

/**
 * Standard dashboard page header, in the house language the landing uses:
 * bracketed mono kicker, a hairline, the title in the display serif, and
 * metadata in mono. Every dashboard page renders this, so changing it here
 * is what makes the whole workspace read as one with the public site.
 */
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
    <header className="dash-enter relative">
      <p className="lp-meta text-accent">
        <span className="lp-bracket">{kicker}</span>
      </p>
      <span className="lp-rule mt-3" aria-hidden="true" />
      <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="lp-title text-ink">{title}</h1>
          {meta && <p className="lp-meta mt-3 text-ink-muted">{meta}</p>}
        </div>
        {action && <div className="flex shrink-0 flex-wrap items-center gap-2.5">{action}</div>}
      </div>
    </header>
  );
}

/** Back link used on every detail page. */
export function BackLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="group lp-meta inline-flex min-h-[44px] items-center gap-2 text-ink-muted transition-colors hover:text-accent"
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
    <div className="lp-hud px-6 py-12 text-center sm:px-12 sm:py-16">
      {Icon && (
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-line bg-surface text-ink-faint">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
      )}
      <p className="font-serif text-xl text-ink sm:text-2xl">{title}</p>
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
    <div className="border-t border-rule pt-3.5">
      <dt className="lp-meta">
        <span className="lp-bracket">{label}</span>
      </dt>
      <dd className="mt-1.5 text-[0.9375rem] font-medium text-ink leading-relaxed">
        {value}
      </dd>
    </div>
  );
}

/** Monogram stand-in for an avatar. */
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
      className={`${dim} flex shrink-0 items-center justify-center rounded-full border border-line bg-surface font-serif text-accent`}
    >
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

// Flat surfaces, no backdrop blur: nothing moves behind a dashboard card,
// so the blur only cost GPU time on phones.
const PANEL_TONE = {
  default: "border-line/60 bg-surface",
  accent: "border-line-accent/60 bg-surface",
  warning: "border-warning/50 bg-warning-wash/40",
  sunk: "border-rule bg-canvas-sunk",
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
      className={`rounded-xl border p-5 sm:p-6 ${PANEL_TONE[tone]} ${className}`}
      {...rest}
    >
      {children}
    </section>
  );
}

/**
 * Section heading inside a Panel or between blocks: mono bracketed label,
 * optional count/meta on the right and an optional action. Pass `id` and
 * point the Panel's aria-labelledby at it.
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
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-rule pb-3">
      <h2 id={id} className={`lp-meta font-semibold ${color}`}>
        <span className="lp-bracket">{title}</span>
      </h2>
      {(meta || action) && (
        <div className="flex items-center gap-3">
          {meta && <span className="lp-meta">{meta}</span>}
          {action}
        </div>
      )}
    </div>
  );
}
/* ------------------------------------------------------------------
 * "Buku kerja" primitives (Rilis 2, opsi A — tenang, rapat, tabular).
 * Pure presentational: no hooks, so server pages and the client board
 * share them. Colours only through tokens; numbers through `.num`
 * (tabular figures) + the dashboard mono face.
 * ------------------------------------------------------------------ */

/**
 * Label → value rows, value right-aligned. The cash summary and the
 * event facts are both "a short list of named numbers/facts", so they
 * read as one ruled block instead of a row of glowing cards.
 */
export function SummaryRows({
  rows,
  mono = true,
  label,
}: {
  rows: { label: ReactNode; value: ReactNode; emphasis?: boolean }[];
  /** Mono + tabular for money/counts; off for prose values (PIC, notes). */
  mono?: boolean;
  /** Accessible name for the list. */
  label?: string;
}) {
  return (
    <dl
      aria-label={label}
      className="divide-y divide-rule-soft overflow-hidden rounded-xl border border-line/50 bg-surface"
    >
      {rows.map((r, i) => (
        <div
          key={i}
          className={`flex items-baseline justify-between gap-4 px-4 py-3 ${
            r.emphasis ? "bg-canvas-sunk/60" : ""
          }`}
        >
          <dt className={`text-sm ${r.emphasis ? "font-semibold text-ink" : "text-ink-muted"}`}>
            {r.label}
          </dt>
          <dd
            className={`min-w-0 text-right text-ink ${
              mono ? "num font-mono text-base" : "text-sm"
            } ${r.emphasis ? "font-semibold" : ""}`}
          >
            {r.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export type ChipTone = "neutral" | "sage" | "warning" | "danger" | "accent";

const CHIP_TONE: Record<ChipTone, string> = {
  neutral: "tag",
  sage: "tag tag-sage",
  warning: "tag tag-warning",
  accent: "tag tag-accent",
  danger: "tag border-danger/60 text-danger",
};

/** Small mono status label. The word carries the meaning; colour only helps. */
export function StatusChip({ tone = "neutral", children }: { tone?: ChipTone; children: ReactNode }) {
  return <span className={CHIP_TONE[tone]}>{children}</span>;
}

/** Progress track filled with the brand `.meter-fill` (sage once complete). */
export function Meter({ value, max, label }: { value: number; max: number; label: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div
      className="h-2 w-full overflow-hidden rounded-full bg-canvas-sunk"
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={label}
    >
      <div
        className={value >= max ? "h-full rounded-full bg-sage" : "meter-fill h-full rounded-full"}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export interface DataColumn<T> {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  /** Numbers right-aligned in mono; text left. */
  align?: "left" | "right";
  /** Shown as the card's first line on phones (no label). */
  primary?: boolean;
  /** Visually hidden header (e.g. the actions column). */
  srOnlyHeader?: boolean;
}

/**
 * One list, two layouts: a ruled table from 640 px, a stack of row-cards
 * below it (each non-primary cell gets its column name as a label). Same
 * data, same order, no horizontal scroll on a 360 px phone.
 */
export function DataTable<T>({
  rows,
  columns,
  rowKey,
  caption,
  footer,
}: {
  rows: T[];
  columns: DataColumn<T>[];
  rowKey: (row: T) => string;
  /** Read by screen readers; visually hidden. */
  caption: string;
  /** Totals etc. — label/value pairs under the list. */
  footer?: { label: string; value: ReactNode }[];
}) {
  const primary = columns.filter((c) => c.primary);
  const rest = columns.filter((c) => !c.primary);
  // Footer totals line up under the last visible numeric column, not under
  // a trailing actions column.
  let valueIdx = columns.length - 1;
  for (let i = columns.length - 1; i >= 0; i--) {
    if (columns[i].align === "right" && !columns[i].srOnlyHeader) {
      valueIdx = i;
      break;
    }
  }
  const trailing = columns.length - valueIdx - 1;
  return (
    <div className="overflow-hidden rounded-xl border border-line/50 bg-surface">
      <table className="hidden w-full border-collapse text-sm sm:table">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-rule">
            {columns.map((c) => (
              <th
                key={c.key}
                scope="col"
                className={`px-4 py-2.5 font-mono text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-ink-muted ${
                  c.align === "right" ? "text-right" : "text-left"
                }`}
              >
                {c.srOnlyHeader ? <span className="sr-only">{c.header}</span> : c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={rowKey(r)} className="border-t border-rule-soft first:border-t-0">
              {columns.map((c) => (
                <td
                  key={c.key}
                  className={`px-4 py-3 align-top ${
                    c.align === "right" ? "num text-right font-mono" : "text-left"
                  }`}
                >
                  {c.cell(r)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        {footer && footer.length > 0 && (
          <tfoot>
            {footer.map((f) => (
              <tr key={f.label} className="border-t border-rule">
                <th
                  scope="row"
                  colSpan={valueIdx}
                  className="px-4 py-2.5 text-right text-sm font-normal text-ink-muted"
                >
                  {f.label}
                </th>
                <td className="num px-4 py-2.5 text-right font-mono text-ink">{f.value}</td>
                {trailing > 0 && <td colSpan={trailing} aria-hidden="true" />}
              </tr>
            ))}
          </tfoot>
        )}
      </table>

      <ul className="divide-y divide-rule-soft sm:hidden" aria-label={caption}>
        {rows.map((r) => (
          <li key={rowKey(r)} className="px-4 py-3">
            {primary.map((c) => (
              <div key={c.key}>{c.cell(r)}</div>
            ))}
            {rest.length > 0 && (
              <dl className="mt-2 space-y-1.5">
                {rest.map((c) => (
                  <div key={c.key} className="flex items-center justify-between gap-3">
                    <dt className={`text-xs text-ink-muted ${c.srOnlyHeader ? "sr-only" : ""}`}>
                      {c.header}
                    </dt>
                    <dd
                      className={`min-w-0 ${
                        c.align === "right" ? "num text-right font-mono" : ""
                      } ${c.srOnlyHeader ? "ml-auto" : ""}`}
                    >
                      {c.cell(r)}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </li>
        ))}
        {footer?.map((f) => (
          <li key={f.label} className="flex items-baseline justify-between gap-3 bg-canvas-sunk/60 px-4 py-2.5">
            <span className="text-sm text-ink-muted">{f.label}</span>
            <span className="num font-mono text-ink">{f.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
