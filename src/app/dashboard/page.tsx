import Link from "next/link";
import type { Metadata } from "next";
import {
  Users,
  Network,
  CalendarDays,
  Wallet,
  AlertTriangle,
  ArrowRight,
  Plus,
} from "lucide-react";
import {
  getDashboardStats,
  getUpcomingGathering,
  getFatigueAlerts,
  getRecentActivity,
  getProfiles,
} from "@/lib/data";
import type { StewardAssignment } from "@/lib/types";
import {
  formatFullDate,
  formatTime,
  formatDateTime,
  countdownLabel,
  eventTypeLabel,
  formatRupiahCompact,
} from "@/lib/datetime";

export const metadata: Metadata = { title: "Dashboard" };

/** Roles a Saturday service needs filled, used for the readiness meter. */
const REQUIRED_ROLES = 6;

export default async function DashboardPage() {
  const [stats, upcoming, fatigueAlerts, activities, profiles] =
    await Promise.all([
      getDashboardStats(),
      getUpcomingGathering(),
      getFatigueAlerts(),
      getRecentActivity(),
      getProfiles(),
    ]);

  const nameOf = (id: string) =>
    profiles.find((p) => p.id === id)?.nickname ?? "—";

  const stewards = (upcoming?.stewardAssignments ?? []).filter(
    (s: StewardAssignment) => s.status !== "replaced"
  );
  const filled = stewards.length;
  const readiness = Math.min(100, Math.round((filled / REQUIRED_ROLES) * 100));

  const statCards = [
    { label: "Anggota", value: String(stats.totalMembers), icon: Users, href: "/dashboard/members" },
    { label: "Cross aktif", value: String(stats.activeCrossGroups), icon: Network, href: "/dashboard/cross" },
    { label: "Ibadah bulan ini", value: String(stats.monthGatherings), icon: CalendarDays, href: "/dashboard/gatherings" },
    { label: "Saldo kas", value: formatRupiahCompact(stats.monthlyBalance), icon: Wallet, href: "/dashboard/finance" },
  ];

  return (
    <div className="px-5 py-7 sm:px-8 sm:py-9">
      <header>
        <p className="kicker">
          <span className="kicker-num">Hari ini</span>
          {formatFullDate(new Date())}
        </p>
        <h1 className="section-heading mt-3 text-3xl">Dashboard</h1>
      </header>

      {/* Stat tiles — each one is a link to the module it summarises. */}
      <div className="mt-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {statCards.map((s) => {
          const Icon = s.icon;
          return (
            <Link key={s.label} href={s.href} className="card-surface p-4">
              <Icon
                className="h-4 w-4 text-ink-faint"
                strokeWidth={1.8}
                aria-hidden="true"
              />
              <p className="num mt-3 font-serif text-2xl font-semibold text-ink">
                {s.value}
              </p>
              <p className="mt-0.5 text-sm text-ink-muted">{s.label}</p>
            </Link>
          );
        })}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Next service */}
          {upcoming && (
            <section aria-labelledby="next-heading" className="card p-5 sm:p-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className="tag tag-accent">
                  {eventTypeLabel(upcoming.eventType)}
                </span>
                <span className="tag">{countdownLabel(upcoming.date)}</span>
              </div>

              <h2
                id="next-heading"
                className="t-subtitle mt-3.5 text-ink"
              >
                {upcoming.weeklyTheme}
              </h2>
              <p className="mt-1 text-sm text-ink-muted">
                {formatFullDate(upcoming.date)} · {formatTime(upcoming.date)}
              </p>

              {/* Readiness meter */}
              <div className="mt-5">
                <div className="flex items-baseline justify-between">
                  <span className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-ink-faint">
                    Kesiapan tim
                  </span>
                  <span className="num text-sm font-medium text-ink">
                    {filled}/{REQUIRED_ROLES}
                  </span>
                </div>
                <div
                  className="mt-2 h-1.5 overflow-hidden rounded-full bg-canvas-sunk"
                  role="progressbar"
                  aria-valuenow={filled}
                  aria-valuemin={0}
                  aria-valuemax={REQUIRED_ROLES}
                  aria-label="Jumlah penatalayan yang sudah terisi"
                >
                  {/* Incomplete fills with fire (maroon into gold) so it
                      reads as still heating up; a complete team goes flat
                      sage — done, nothing more to look at. */}
                  <div
                    className={
                      filled >= REQUIRED_ROLES
                        ? "h-full rounded-full bg-sage"
                        : "meter-fill h-full rounded-full"
                    }
                    style={{ width: `${readiness}%` }}
                  />
                </div>
              </div>

              {stewards.length > 0 ? (
                <ul className="mt-5 grid gap-2 sm:grid-cols-2">
                  {stewards.map((s: StewardAssignment) => (
                    <li
                      key={s.id}
                      className="flex items-baseline justify-between gap-3 rounded-md bg-canvas-sunk px-3 py-2.5"
                    >
                      <span className="truncate text-sm font-medium text-ink">
                        {nameOf(s.profileId)}
                      </span>
                      <span className="shrink-0 font-mono text-[0.625rem] uppercase tracking-[0.1em] text-ink-faint">
                        {s.role}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-5 rounded-md bg-canvas-sunk px-3 py-3 text-sm text-ink-muted">
                  Belum ada penatalayan yang ditugaskan.
                </p>
              )}

              <Link
                href={`/dashboard/gatherings/${upcoming.id}`}
                className="btn-quiet mt-4 -ml-3"
              >
                Lihat detail ibadah
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </section>
          )}

          {/* Fatigue */}
          {fatigueAlerts.length > 0 && (
            <section
              aria-labelledby="fatigue-heading"
              className="card border-l-2 border-l-warning p-5"
            >
              <h2
                id="fatigue-heading"
                className="flex items-center gap-2 font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-warning"
              >
                <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                Perlu diistirahatkan
              </h2>
              <ul className="mt-3.5 space-y-2.5">
                {fatigueAlerts.map((alert) => (
                  <li
                    key={alert.member.id}
                    className="flex flex-wrap items-center justify-between gap-2"
                  >
                    <p className="text-sm text-ink-muted">
                      <span className="font-medium text-ink">
                        {alert.member.nickname}
                      </span>{" "}
                      sudah melayani {alert.serviceCount}× bulan ini
                    </p>
                    <Link
                      href={`/dashboard/members/${alert.member.id}`}
                      className="btn-quiet text-sm"
                    >
                      Lihat
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Quick actions */}
          <section aria-labelledby="quick-heading">
            <h2
              id="quick-heading"
              className="font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-ink-faint"
            >
              Aksi cepat
            </h2>
            <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {[
                { href: "/dashboard/gatherings", label: "Jadwal ibadah" },
                { href: "/dashboard/members", label: "Data anggota" },
                { href: "/dashboard/finance", label: "Catat transaksi" },
                { href: "/dashboard/meetings", label: "Notulen rapat" },
              ].map((a) => (
                <Link
                  key={a.href}
                  href={a.href}
                  className="card-surface flex min-h-[76px] flex-col justify-between p-3"
                >
                  <Plus
                    className="h-4 w-4 text-accent"
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                  <span className="text-sm leading-snug text-ink">
                    {a.label}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        </div>

        {/* Activity */}
        <section aria-labelledby="activity-heading" className="card h-fit p-5">
          <h2
            id="activity-heading"
            className="font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-ink-faint"
          >
            Aktivitas terakhir
          </h2>
          {activities.length > 0 ? (
            <ol className="mt-4 space-y-3.5">
              {activities.map((activity) => (
                <li
                  key={activity.id}
                  className="border-b border-rule-soft pb-3.5 last:border-0 last:pb-0"
                >
                  <p className="text-sm leading-snug text-ink-muted">
                    {activity.description}
                  </p>
                  <p className="mt-1 font-mono text-[0.625rem] text-ink-faint">
                    {formatDateTime(activity.createdAt)}
                  </p>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-4 text-sm text-ink-muted">Belum ada aktivitas.</p>
          )}
        </section>
      </div>
    </div>
  );
}
