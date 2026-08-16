"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

/**
 * Accessible dialog shell.
 *
 * The two form modals previously rendered as plain divs: no role, no
 * aria-modal, no Escape, no focus containment and no scroll lock. Keyboard
 * users could tab straight out of the dialog into the page behind it and
 * had no way to dismiss it without a mouse.
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
      <button
        type="button"
        tabIndex={-1}
        aria-hidden="true"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default bg-deep/45"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 my-0 w-full max-w-md rounded-t-2xl border border-rule bg-surface p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:my-8 sm:rounded-2xl sm:p-6"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            {kicker && (
              <span className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-accent">
                {kicker}
              </span>
            )}
            <h2
              id={titleId}
              className="mt-1 font-serif text-xl font-semibold text-ink"
            >
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="-mr-1.5 -mt-1.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-canvas-sunk hover:text-ink"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/** Shared field wrapper so both forms label and space controls identically. */
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
        className="font-mono text-[0.625rem] uppercase tracking-[0.14em] text-ink-muted"
      >
        {label}
      </label>
      {children}
      {hint && !error && (
        <span className="text-xs text-ink-faint">{hint}</span>
      )}
      {error && (
        <span role="alert" className="text-xs text-danger">
          {error}
        </span>
      )}
    </div>
  );
}

/** One place for input styling, including the visible focus ring. */
export const fieldClass =
  "min-h-[44px] rounded-md border border-rule bg-surface px-3 py-2 text-[0.9375rem] text-ink transition-colors focus:border-accent";
