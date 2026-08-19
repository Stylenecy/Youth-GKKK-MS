"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS, isActive } from "./nav-items";
import { Logomark } from "./Masthead";

/** Persistent rail. Hidden below `lg`, where MobileNav takes over. */
export function Sidebar() {
  const pathname = usePathname();

  const mainItems = NAV_ITEMS.filter((i) => i.section === "utama");
  const adminItems = NAV_ITEMS.filter((i) => i.section === "admin");

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-rule-soft bg-surface/90 backdrop-blur-xl lg:flex z-30">
      {/* Top Header Identity */}
      <div className="border-b border-rule-soft px-5 py-4">
        <Link
          href="/dashboard"
          className="group flex min-h-[44px] items-center gap-3 text-ink transition-transform duration-200"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-line-accent/40 bg-surface-2 p-1.5 shadow-[0_0_14px_rgba(253,190,2,0.15)] transition-all duration-300 group-hover:border-accent group-hover:shadow-[0_0_20px_rgba(253,190,2,0.35)]">
            <Logomark className="h-full w-full" />
          </div>
          <span className="leading-tight">
            <span className="block font-serif text-base font-bold tracking-tight text-ink group-hover:text-accent transition-colors">
              Youth Dashboard
            </span>
            <span className="block font-mono text-[0.5625rem] uppercase tracking-[0.2em] text-ink-faint">
              Komisi Pengurus
            </span>
          </span>
        </Link>
      </div>

      {/* Navigation Sections */}
      <nav aria-label="Navigasi utama" className="flex-1 overflow-y-auto px-3.5 py-4 space-y-6">
        {/* Section 1: Pelayanan & Komunitas */}
        <div>
          <p className="px-3 pb-2 font-mono text-[0.625rem] font-bold uppercase tracking-[0.2em] text-ink-faint">
            ( Pelayanan )
          </p>
          <ul className="space-y-1">
            {mainItems.map((item) => {
              const active = isActive(pathname, item.href);
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`nav-item ${
                      active ? "is-active" : ""
                    } group flex min-h-[44px] items-center gap-3 rounded-xl px-3.5 text-[0.9375rem] transition-all duration-200 ${
                      active
                        ? "bg-accent-wash/90 font-semibold text-accent shadow-[inset_0_1px_0_rgba(253,190,2,0.15)]"
                        : "text-ink-muted hover:bg-surface-2 hover:text-ink"
                    }`}
                  >
                    <Icon
                      className={`h-[18px] w-[18px] shrink-0 transition-transform group-hover:scale-110 ${
                        active ? "text-accent" : "text-ink-faint group-hover:text-ink"
                      }`}
                      strokeWidth={active ? 2.3 : 1.8}
                      aria-hidden="true"
                    />
                    <span className="truncate">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Section 2: Administrasi & Tata Kelola */}
        <div>
          <p className="px-3 pb-2 font-mono text-[0.625rem] font-bold uppercase tracking-[0.2em] text-ink-faint">
            ( Tata Kelola )
          </p>
          <ul className="space-y-1">
            {adminItems.map((item) => {
              const active = isActive(pathname, item.href);
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`nav-item ${
                      active ? "is-active" : ""
                    } group flex min-h-[44px] items-center gap-3 rounded-xl px-3.5 text-[0.9375rem] transition-all duration-200 ${
                      active
                        ? "bg-accent-wash/90 font-semibold text-accent shadow-[inset_0_1px_0_rgba(253,190,2,0.15)]"
                        : "text-ink-muted hover:bg-surface-2 hover:text-ink"
                    }`}
                  >
                    <Icon
                      className={`h-[18px] w-[18px] shrink-0 transition-transform group-hover:scale-110 ${
                        active ? "text-accent" : "text-ink-faint group-hover:text-ink"
                      }`}
                      strokeWidth={active ? 2.3 : 1.8}
                      aria-hidden="true"
                    />
                    <span className="truncate">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      {/* Footer Section */}
      <div className="border-t border-rule-soft p-3.5 space-y-2">
        <Link
          href="/"
          className="flex min-h-[44px] items-center justify-between gap-2 rounded-xl px-3 font-mono text-xs text-ink-faint transition-all duration-200 hover:bg-surface-2 hover:text-accent"
        >
          <span className="flex items-center gap-2">
            <span aria-hidden="true">&larr;</span> Halaman depan
          </span>
          <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
        </Link>
      </div>
    </aside>
  );
}
