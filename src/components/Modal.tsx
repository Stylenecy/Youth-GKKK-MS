"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

/**
 * Accessible luxury dialog shell with Nocturne aesthetics.
 * Complete focus management, Escape key dismiss, and screen-reader polite markup.
 */
export function Modal({
  open,
  onClose,
  title,
  kicker,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  kicker?: string;
  children: ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreTo = useRef<HTMLElement | null>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;

    restoreTo.current = document.activeElement as HTMLElement | null;

    const panel = panelRef.current;
    panel?.querySelector<HTMLElement>(FOCUSABLE)?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== "Tab" || !panel) return;

      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null
      );
      if (items.length === 0) return;

      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;

      // Wrap focus so Tab never escapes the dialog.
      if (e.shiftKey && (active === first || !panel.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown, true);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      document.body.style.overflow = prevOverflow;
      restoreTo.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto p-0 sm:items-center sm:p-4">
      {/* Backdrop */}
      <button
        type="button"
        tabIndex={-1}
        aria-hidden="true"
        onClick={onClose}
        className="fixed inset-0 h-full w-full cursor-default bg-canvas/80 backdrop-blur-md transition-opacity"
      />

      {/* Modal Dialog Card */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 my-0 w-full max-w-lg overflow-hidden rounded-t-3xl border border-line-accent/40 bg-surface/95 p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-[0_24px_64px_rgba(0,0,0,0.8),0_0_32px_rgba(253,190,2,0.1)] backdrop-blur-2xl transition-all sm:my-8 sm:rounded-2xl sm:p-7"
      >
        {/* Subtle Top Accent Beam */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent to-transparent opacity-60"
        />

        <div className="mb-6 flex items-start justify-between gap-4 border-b border-rule-soft pb-4">
          <div>
            {kicker && (
              <span className="font-mono text-[0.625rem] font-bold uppercase tracking-[0.2em] text-accent">
                ( {kicker} )
              </span>
            )}
            <h2
              id={titleId}
              className="mt-1 font-serif text-xl font-bold tracking-tight text-ink sm:text-2xl"
            >
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="-mr-1.5 -mt-1.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-canvas-sunk hover:text-accent"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/** Shared field wrapper so all forms label and space controls identically. */
export function Field({
  name,
  label,
  hint,
  error,
  children,
}: {
  name: string;
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={name}
        className="font-mono text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-ink-muted"
      >
        {label}
      </label>
      {children}
      {hint && !error && (
        <span className="text-xs text-ink-faint leading-relaxed">{hint}</span>
      )}
      {error && (
        <span role="alert" className="text-xs font-medium text-danger">
          {error}
        </span>
      )}
    </div>
  );
}

/** Standard field styling with visible gold focus ring and dark background. */
export const fieldClass =
  "min-h-[44px] w-full rounded-lg border border-rule bg-canvas-sunk/80 px-3.5 py-2.5 text-[0.9375rem] text-ink transition-all duration-200 placeholder:text-ink-faint focus:border-accent focus:bg-surface focus:outline-none focus:ring-1 focus:ring-accent";
