"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navFor, isActive } from "./nav-items";
import type { RoleOrDemo } from "@/lib/roles";
import { Logomark } from "./Masthead";
import { ThemeToggle } from "./DashboardTheme";

/** Persistent rail. Hidden below `lg`, where MobileNav takes over. */
export function Sidebar({ role }: { role: RoleOrDemo }) {
  const pathname = usePathname();

  const items = navFor(role);
  const mainItems = items.filter((i) => i.section === "utama");
  const adminItems = items.filter((i) => i.section === "admin");

  return (
    <aside className="sticky top-0 z-30 hidden h-screen w-64 shrink-0 flex-col border-r border-rule bg-canvas-sunk lg:flex">
      {/* Top Header Identity */}
      <div className="border-b border-rule px-5 py-4">
        <Link href="/dashboard" className="group flex min-h-[44px] items-center gap-3 text-ink">
          <Logomark className="h-9 w-9" />
          <span className="leading-none">
            <span className="block font-serif text-[1.0625rem] tracking-tight text-ink transition-colors group-hover:text-accent">
              Youth GKKK
            </span>
            <span className="lp-meta mt-1.5 block text-[0.625rem]">Ruang pengurus</span>
          </span>
        </Link>
      </div>

      {/* Navigation Sections */}
      <nav aria-label="Navigasi utama" className="flex-1 overflow-y-auto px-3.5 py-4 space-y-6">
        {/* Section 1: Pelayanan & Komunitas */}
        <div>
          <p className="lp-meta px-3 pb-2 text-[0.625rem]">
            <span className="lp-bracket">Pelayanan</span>
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
                    } group flex min-h-[44px] items-center gap-3 rounded-lg px-3.5 text-[0.9375rem] transition-colors duration-200 ${
                      active
                        ? "bg-surface font-semibold text-accent"
                        : "text-ink-muted hover:bg-surface hover:text-ink"
                    }`}
                  >
                    <Icon
                      className={`h-[18px] w-[18px] shrink-0 ${
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
          <p className="lp-meta px-3 pb-2 text-[0.625rem]">
            <span className="lp-bracket">Tata kelola</span>
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
                    } group flex min-h-[44px] items-center gap-3 rounded-lg px-3.5 text-[0.9375rem] transition-colors duration-200 ${
                      active
                        ? "bg-surface font-semibold text-accent"
                        : "text-ink-muted hover:bg-surface hover:text-ink"
                    }`}
                  >
                    <Icon
                      className={`h-[18px] w-[18px] shrink-0 ${
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
      <div className="space-y-2 border-t border-rule p-3.5">
        <ThemeToggle />
        <Link
          href="/"
          className="lp-meta flex min-h-[44px] items-center gap-2 rounded-lg px-3 text-ink-muted transition-colors hover:bg-surface hover:text-accent"
        >
          <span aria-hidden="true">&larr;</span> Halaman depan
        </Link>
      </div>
    </aside>
  );
}
