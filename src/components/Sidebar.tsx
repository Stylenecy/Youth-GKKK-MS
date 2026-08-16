"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS, isActive } from "./nav-items";
import { Logomark } from "./Masthead";

/** Persistent rail. Hidden below `lg`, where MobileNav takes over. */
export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-rule bg-surface lg:flex">
      <div className="border-b border-rule-soft px-5 py-4">
        <Link
          href="/dashboard"
          className="flex min-h-[44px] items-center gap-2.5 text-ink"
        >
          <Logomark />
          <span className="leading-tight">
            <span className="block font-serif text-base font-semibold">
              Space Youth
            </span>
            <span className="block font-mono text-[0.5625rem] uppercase tracking-[0.16em] text-ink-faint">
              GKKK Yogyakarta
            </span>
          </span>
        </Link>
      </div>

      <nav aria-label="Navigasi utama" className="flex-1 overflow-y-auto p-3">
        <ul className="space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex min-h-[44px] items-center gap-3 rounded-md px-3 text-[0.9375rem] transition-colors ${
                    active
                      ? "bg-accent-wash font-medium text-accent"
                      : "text-ink-muted hover:bg-canvas-sunk hover:text-ink"
                  }`}
                >
                  <Icon
                    className="h-[18px] w-[18px] shrink-0"
                    strokeWidth={active ? 2.2 : 1.8}
                    aria-hidden="true"
                  />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Previously `absolute bottom-0` inside a non-positioned parent, which
          anchored it to the viewport instead of the rail. Now it is simply
          the last flex child. */}
      <div className="border-t border-rule-soft p-3">
        <Link
          href="/"
          className="flex min-h-[44px] items-center gap-2 rounded-md px-3 font-mono text-xs text-ink-faint transition-colors hover:bg-canvas-sunk hover:text-ink-muted"
        >
          <span aria-hidden="true">&larr;</span> Ke halaman depan
        </Link>
      </div>
    </aside>
  );
}
