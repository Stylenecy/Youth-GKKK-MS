"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { MoreHorizontal, X } from "lucide-react";
import { NAV_ITEMS, isActive } from "./nav-items";
import { Logomark } from "./Masthead";

/**
 * Responsive Mobile Navigation for phone & tablet.
 * Bottom tab bar with thumb-reachable primary items and modal sheet for administrative modules.
 */
export function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const sheetId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);

  // Close the sheet whenever navigation happens.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  const primary = NAV_ITEMS.filter((i) => i.primary);
  const secondary = NAV_ITEMS.filter((i) => !i.primary);
  const secondaryActive = secondary.some((i) => isActive(pathname, i.href));

  return (
    <>
      {/* Sticky top identity bar */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-rule-soft bg-canvas/90 px-4 py-2.5 backdrop-blur-xl lg:hidden">
        <Link
          href="/dashboard"
          className="group flex min-h-[44px] items-center gap-2.5 text-ink"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-full border border-line-accent/30 bg-surface p-1 shadow-sm">
            <Logomark className="h-full w-full" />
          </div>
          <span className="font-serif text-base font-bold tracking-tight text-ink group-hover:text-accent transition-colors">
            Youth GKKK
          </span>
        </Link>
        <Link
          href="/"
          className="flex min-h-[44px] items-center gap-1.5 px-2 font-mono text-[0.625rem] uppercase tracking-[0.16em] text-ink-faint hover:text-accent transition-colors"
        >
          <span aria-hidden="true">&larr;</span> Depan
        </Link>
      </div>

      {/* Fixed bottom tab bar */}
      <nav
        aria-label="Navigasi modul"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line-accent/30 bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-2xl lg:hidden shadow-[0_-8px_32px_rgba(0,0,0,0.6)]"
      >
        <ul className="mx-auto flex max-w-md items-center justify-around px-1">
          {primary.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <li key={item.href} className="flex-1">
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`relative flex min-h-[58px] flex-col items-center justify-center gap-1 px-1 py-2 text-[0.6875rem] transition-colors ${
                    active
                      ? "font-semibold text-accent"
                      : "text-ink-muted hover:text-ink"
                  }`}
                >
                  {active && (
                    <span
                      aria-hidden="true"
                      className="absolute top-0 h-0.5 w-8 rounded-full bg-accent shadow-[0_0_8px_rgba(253,190,2,0.8)]"
                    />
                  )}
                  <Icon
                    className={`h-5 w-5 transition-transform ${
                      active ? "scale-110 text-accent" : "text-ink-faint"
                    }`}
                    strokeWidth={active ? 2.4 : 1.8}
                    aria-hidden="true"
                  />
                  <span className="truncate max-w-[64px] text-center">{item.label}</span>
                </Link>
              </li>
            );
          })}
          <li className="flex-1">
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-expanded={open}
              aria-controls={sheetId}
              className={`relative flex min-h-[58px] w-full flex-col items-center justify-center gap-1 px-1 py-2 text-[0.6875rem] transition-colors ${
                secondaryActive
                  ? "font-semibold text-accent"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              {secondaryActive && (
                <span
                  aria-hidden="true"
                  className="absolute top-0 h-0.5 w-8 rounded-full bg-accent shadow-[0_0_8px_rgba(253,190,2,0.8)]"
                />
              )}
              <MoreHorizontal
                className={`h-5 w-5 transition-transform ${
                  secondaryActive ? "scale-110 text-accent" : "text-ink-faint"
                }`}
                strokeWidth={secondaryActive ? 2.4 : 1.8}
                aria-hidden="true"
              />
              <span>Lainnya</span>
            </button>
          </li>
        </ul>
      </nav>

      {/* Modal Drawer Sheet */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Tutup menu"
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 h-full w-full cursor-default bg-canvas/80 backdrop-blur-md"
          />
          <div
            id={sheetId}
            role="dialog"
            aria-modal="true"
            aria-label="Menu tata kelola lainnya"
            className="absolute inset-x-0 bottom-0 rounded-t-3xl border-t border-line-accent/40 bg-surface/98 p-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-[0_-16px_48px_rgba(0,0,0,0.8)] backdrop-blur-2xl"
          >
            <div className="flex items-center justify-between border-b border-rule-soft pb-3.5 px-2">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                <h2 className="font-serif text-lg font-bold text-ink">
                  Tata Kelola & Lainnya
                </h2>
              </div>
              <button
                ref={closeRef}
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Tutup menu"
                className="flex h-10 w-10 items-center justify-center rounded-full text-ink-muted hover:bg-surface-2 hover:text-ink"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <ul className="mt-3 space-y-1">
              {secondary.map((item) => {
                const active = isActive(pathname, item.href);
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={`flex min-h-[48px] items-center gap-3.5 rounded-xl px-3.5 text-[0.9375rem] transition-all ${
                        active
                          ? "bg-accent-wash font-semibold text-accent"
                          : "text-ink-muted hover:bg-surface-2 hover:text-ink"
                      }`}
                    >
                      <Icon
                        className="h-[18px] w-[18px]"
                        strokeWidth={1.8}
                        aria-hidden="true"
                      />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
