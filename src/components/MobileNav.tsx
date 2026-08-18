"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { MoreHorizontal, X } from "lucide-react";
import { NAV_ITEMS, isActive } from "./nav-items";
import { Logomark } from "./Masthead";

/**
 * Phone/tablet navigation. Before this, the dashboard rendered
 * `hidden md:block` on the only nav — a phone user had no way to move
 * between modules at all.
 *
 * Bottom tab bar for the four modules used weekly, plus a sheet for the
 * rest. Thumb-reachable, and every target is at least 44x44.
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
      {/* Slim identity bar */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-rule bg-canvas/90 px-4 py-2.5 backdrop-blur-md lg:hidden">
        <Link
          href="/dashboard"
          className="flex min-h-[44px] items-center gap-2 text-ink"
        >
          <Logomark />
          <span className="font-serif text-base font-semibold">Space Youth</span>
        </Link>
        <Link
          href="/"
          className="flex min-h-[44px] items-center px-1 font-mono text-[0.625rem] uppercase tracking-[0.14em] text-ink-faint"
        >
          Halaman depan
        </Link>
      </div>

      {/* Bottom tab bar */}
      <nav
        aria-label="Navigasi modul"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-rule bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        <ul className="mx-auto flex max-w-lg">
          {primary.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <li key={item.href} className="flex-1">
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex min-h-[56px] flex-col items-center justify-center gap-1 px-1 py-2 text-[0.6875rem] transition-colors ${
                    active ? "text-accent" : "text-ink-muted"
                  }`}
                >
                  <Icon
                    className="h-5 w-5"
                    strokeWidth={active ? 2.3 : 1.8}
                    aria-hidden="true"
                  />
                  <span className={active ? "font-medium" : undefined}>
                    {item.label}
                  </span>
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
              className={`flex min-h-[56px] w-full flex-col items-center justify-center gap-1 px-1 py-2 text-[0.6875rem] transition-colors ${
                secondaryActive ? "text-accent" : "text-ink-muted"
              }`}
            >
              <MoreHorizontal
                className="h-5 w-5"
                strokeWidth={secondaryActive ? 2.3 : 1.8}
                aria-hidden="true"
              />
              <span className={secondaryActive ? "font-medium" : undefined}>
                Lainnya
              </span>
            </button>
          </li>
        </ul>
      </nav>

      {/* Sheet */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Tutup menu"
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="absolute inset-0 h-full w-full cursor-default bg-deep/40"
          />
          <div
            id={sheetId}
            role="dialog"
            aria-modal="true"
            aria-label="Menu lainnya"
            className="absolute inset-x-0 bottom-0 rounded-t-2xl border-t border-rule bg-surface pb-[env(safe-area-inset-bottom)]"
          >
            <div className="flex items-center justify-between border-b border-rule-soft px-5 py-3.5">
              <h2 className="font-serif text-lg font-semibold text-ink">
                Menu lainnya
              </h2>
              <button
                ref={closeRef}
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Tutup menu"
                className="flex h-11 w-11 items-center justify-center rounded-full text-ink-muted hover:bg-surface-2 hover:text-ink"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <ul className="p-3">
              {secondary.map((item) => {
                const active = isActive(pathname, item.href);
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={`flex min-h-[48px] items-center gap-3 rounded-md px-3 text-[0.9375rem] ${
                        active
                          ? "bg-accent-wash font-medium text-accent"
                          : "text-ink-muted hover:bg-surface-2 hover:text-ink"
                      }`}
                    >
                      <Icon
                        className="h-[18px] w-[18px]"
                        strokeWidth={1.8}
                        aria-hidden="true"
                      />
                      {item.label}
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
