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
  Clock,
  Sparkles,
  ChevronRight,
  ShieldAlert,
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
import { Monogram } from "@/components/page-parts";

export const metadata: Metadata = { title: "Dashboard Pengurus" };

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
    {
      kicker: "ANGGOTA",
      label: "Total Terdaftar",
      value: String(stats.totalMembers),
      icon: Users,
      href: "/dashboard/members",
      hint: "Data jemaat pemuda",
    },
    {
      kicker: "CROSS",
      label: "Kelompok Aktif",
      value: String(stats.activeCrossGroups),
      icon: Network,
      href: "/dashboard/cross",
      hint: "Pemuridan sel",
    },
    {
      kicker: "IBADAH",
      label: "Bulan Ini",
      value: String(stats.monthGatherings),
      icon: CalendarDays,
      href: "/dashboard/gatherings",
      hint: "Ibadah raya terjadwal",
    },
    {
      kicker: "KAS KEUANGAN",
      label: "Saldo Kas",
      value: formatRupiahCompact(stats.totalBalance),
      icon: Wallet,
      href: "/dashboard/finance",
      hint: "Kas besar & kecil",
    },
  ];

  return (
    <div className="px-5 py-7 sm:px-8 sm:py-9">
      {/* Editorial Header Banner */}
      <header className="relative flex flex-col gap-4 border-b border-rule-soft pb-7 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <p className="kicker">
              <span className="kicker-num">( RINGKASAN PELAYANAN )</span>
            </p>
            <span className="hidden sm:inline-block text-xs font-mono text-ink-faint">
              · {formatFullDate(new Date())}
            </span>
          </div>
          <h1 className="section-heading mt-2.5 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Dashboard Pengurus
          </h1>
          <p className="mt-1 text-sm text-ink-muted leading-relaxed">
            Pusat koordinasi ritme mingguan, penatalayanan ibadah, dan administrasi Youth GKKK.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <Link
            href="/dashboard/gatherings"
            className="btn-primary text-xs sm:text-sm shadow-[0_0_16px_rgba(253,190,2,0.25)]"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Ibadah Baru
          </Link>
        </div>
      </header>

      {/* 4 Architectural KPI Stat Cards */}
      <div className="mt-8 grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        {statCards.map((s) => {
          const Icon = s.icon;
          return (
            <Link
              key={s.kicker}
              href={s.href}
              className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-line/40 bg-surface/70 p-5 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-accent hover:bg-surface hover:shadow-[0_12px_32px_rgba(253,190,2,0.15)]"
            >
              {/* Subtle Ambient Glow */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-accent/5 blur-xl transition-opacity group-hover:bg-accent/15"
              />

              <div className="flex items-center justify-between">
                <span className="font-mono text-[0.625rem] font-bold uppercase tracking-[0.2em] text-accent">
                  ( {s.kicker} )
                </span>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-rule-soft bg-surface-2/80 text-ink-faint transition-colors group-hover:border-line-accent group-hover:text-accent">
                  <Icon className="h-4 w-4" strokeWidth={1.9} aria-hidden="true" />
                </div>
              </div>

              <div className="mt-4">
                <p className="num font-serif text-2xl font-bold tracking-tight text-ink sm:text-3xl group-hover:text-accent transition-colors">
                  {s.value}
                </p>
                <div className="mt-1 flex items-center justify-between">
                  <p className="text-xs font-medium text-ink-muted">{s.label}</p>
                  <ChevronRight className="h-3.5 w-3.5 text-ink-faint opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-0.5" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Main Grid: Left Column (Next Gathering & Alerts) vs Right Column (Activity & Quick Actions) */}
      <div className="mt-8 grid gap-7 lg:grid-cols-3">
        {/* Left Column (2 Cols) */}
        <div className="space-y-7 lg:col-span-2">
          {/* Next Gathering Spotlight Card */}
          {upcoming ? (
            <section
              aria-labelledby="next-heading"
              className="relative overflow-hidden rounded-2xl border border-line-accent/40 bg-surface/85 p-6 backdrop-blur-2xl shadow-[0_16px_40px_rgba(0,0,0,0.5)] transition-all duration-300 hover:border-accent/60 sm:p-7"
            >
              {/* Top Accent Rim */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent to-transparent opacity-60"
              />

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="inline-flex items-center gap-2 rounded-full border border-line-accent bg-accent-wash/80 px-3.5 py-1 shadow-sm">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
                    </span>
                    <span className="font-mono text-xs font-bold uppercase tracking-wider text-accent">
                      {countdownLabel(upcoming.date)}
                    </span>
                  </div>

                  <span className="tag border-line text-ink-muted">
                    {eventTypeLabel(upcoming.eventType)}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-xs font-mono text-ink-faint">
                  <Clock className="h-3.5 w-3.5 text-accent" />
                  <span>{formatTime(upcoming.date)} WIB</span>
                </div>
              </div>

              {/* Theme & Meta */}
              <h2
                id="next-heading"
                className="font-serif text-2xl font-bold tracking-tight text-ink sm:text-3xl mt-4"
              >
                {upcoming.weeklyTheme}
              </h2>

              <p className="mt-1.5 text-sm text-ink-muted">
                {formatFullDate(upcoming.date)} · Ruang Hermon
              </p>

              {/* Readiness progress meter */}
              <div className="mt-6 rounded-xl border border-rule-soft bg-canvas-sunk/70 p-4">
                <div className="flex items-baseline justify-between">
                  <span className="font-mono text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-accent">
                    Kesiapan Penatalayan
                  </span>
                  <span className="num font-mono text-xs font-bold text-ink">
                    {filled} / {REQUIRED_ROLES} Petugas ({readiness}%)
                  </span>
                </div>

                <div
                  className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-surface-2"
                  role="progressbar"
                  aria-valuenow={filled}
                  aria-valuemin={0}
                  aria-valuemax={REQUIRED_ROLES}
                  aria-label="Jumlah penatalayan yang sudah terisi"
                >
                  <div
                    className={
                      filled >= REQUIRED_ROLES
                        ? "h-full rounded-full bg-sage shadow-[0_0_8px_rgba(123,160,108,0.5)]"
                        : "meter-fill h-full rounded-full"
                    }
                    style={{ width: `${readiness}%` }}
                  />
                </div>
              </div>

              {/* Stewards Roster Grid */}
              <div className="mt-6">
                <p className="font-mono text-[0.6875rem] font-bold uppercase tracking-[0.18em] text-ink-faint mb-3">
                  ( Petugas Pelayanan Terjadwal )
                </p>

                {stewards.length > 0 ? (
                  <ul className="grid gap-2.5 sm:grid-cols-2">
                    {stewards.map((s: StewardAssignment) => (
                      <li
                        key={s.id}
                        className="flex items-center gap-3 rounded-xl border border-line/40 bg-canvas-sunk/60 px-3.5 py-2.5 transition-colors hover:border-line-accent"
                      >
                        <Monogram name={nameOf(s.profileId)} size="sm" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-ink">
                            {nameOf(s.profileId)}
                          </p>
                          <p className="font-mono text-[0.625rem] uppercase tracking-[0.12em] text-accent">
                            {s.role}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="rounded-xl border border-dashed border-rule bg-canvas-sunk/40 px-4 py-5 text-center text-sm text-ink-muted">
                    Belum ada penatalayan yang ditetapkan untuk ibadah ini.
                  </div>
                )}
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-rule-soft pt-4">
                <Link
                  href={`/dashboard/gatherings/${upcoming.id}`}
                  className="btn-quiet text-xs sm:text-sm font-semibold"
                >
                  Kelola Detail Ibadah & Penatalayan
                  <ArrowRight className="h-4 w-4 ml-1" aria-hidden="true" />
                </Link>
              </div>
            </section>
          ) : (
            <div className="rounded-2xl border border-dashed border-rule bg-surface/40 p-8 text-center">
              <Sparkles className="mx-auto h-8 w-8 text-accent opacity-80" />
              <h3 className="font-serif text-xl font-bold text-ink mt-3">
                Belum ada jadwal ibadah terdekat
              </h3>
              <p className="mt-2 text-sm text-ink-muted max-w-sm mx-auto">
                Silakan buat jadwal ibadah raya pemuda berikutnya untuk mulai mengatur penatalayanan.
              </p>
              <Link href="/dashboard/gatherings" className="btn-primary mt-5 text-xs sm:text-sm">
                Jadwalkan Ibadah Baru
              </Link>
            </div>
          )}

          {/* Fatigue Alerts */}
          {fatigueAlerts.length > 0 && (
            <section
              aria-labelledby="fatigue-heading"
              className="rounded-2xl border border-warning/50 bg-warning-wash/40 p-5 sm:p-6 backdrop-blur-xl"
            >
              <div className="flex items-center justify-between border-b border-warning/20 pb-3">
                <h2
                  id="fatigue-heading"
                  className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.18em] text-warning"
                >
                  <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
                  Perhatian Beban Pelayanan (Fatigue Alert)
                </h2>
                <span className="font-mono text-xs font-bold text-warning">
                  {fatigueAlerts.length} Orang
                </span>
              </div>

              <p className="mt-3 text-xs leading-relaxed text-ink-muted">
                Anggota berikut telah melayani &gt;3 kali dalam 30 hari terakhir. Pertimbangkan untuk mengistirahatkan mereka agar tidak jenuh/kelelahan.
              </p>

              <ul className="mt-4 space-y-2.5">
                {fatigueAlerts.map((alert) => (
                  <li
                    key={alert.member.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-warning/30 bg-surface/80 px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <Monogram name={alert.member.nickname} size="sm" />
                      <div>
                        <p className="font-serif text-base font-semibold text-ink">
                          {alert.member.nickname}
                        </p>
                        <p className="font-mono text-xs text-warning">
                          {alert.serviceCount}&times; pelayanan bulan ini
                        </p>
                      </div>
                    </div>
                    <Link
                      href={`/dashboard/members/${alert.member.id}`}
                      className="btn-outline text-xs px-3 py-1.5 rounded-full"
                    >
                      Lihat Profil &rarr;
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Quick Actions Deck */}
          <section aria-labelledby="quick-heading" className="rounded-2xl border border-rule-soft bg-surface/40 p-5 sm:p-6">
            <h2
              id="quick-heading"
              className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-accent mb-4"
            >
              ( Aksi Cepat Pengurus )
            </h2>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { href: "/dashboard/gatherings", label: "Kelola Ibadah", sub: "Jadwal & Tim" },
                { href: "/dashboard/members", label: "Data Anggota", sub: "Direktori Jemaat" },
                { href: "/dashboard/finance", label: "Catat Kas", sub: "Buku Transaksi" },
                { href: "/dashboard/meetings", label: "Notulen Rapat", sub: "Arsip Keputusan" },
              ].map((a) => (
                <Link
                  key={a.href}
                  href={a.href}
                  className="group relative flex flex-col justify-between rounded-xl border border-rule bg-surface/70 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-accent hover:bg-surface hover:shadow-md"
                >
                  <Plus
                    className="h-4 w-4 text-accent transition-transform group-hover:scale-125"
                    strokeWidth={2.2}
                    aria-hidden="true"
                  />
                  <div className="mt-3">
                    <p className="font-serif text-base font-bold text-ink group-hover:text-accent transition-colors leading-tight">
                      {a.label}
                    </p>
                    <p className="font-mono text-[0.625rem] text-ink-faint uppercase tracking-wider mt-0.5">
                      {a.sub}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column (1 Col: Recent Activities & Fast Feed) */}
        <div className="space-y-7">
          <section
            aria-labelledby="activity-heading"
            className="rounded-2xl border border-line/40 bg-surface/70 p-5 sm:p-6 backdrop-blur-xl"
          >
            <div className="flex items-center justify-between border-b border-rule-soft pb-3">
              <h2
                id="activity-heading"
                className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-accent"
              >
                ( Aktivitas Terakhir )
              </h2>
              <Link
                href="/dashboard/audit"
                className="font-mono text-[0.625rem] uppercase tracking-wider text-ink-faint hover:text-accent transition-colors"
              >
                Semua &rarr;
              </Link>
            </div>

            {activities.length > 0 ? (
              <ol className="mt-4 space-y-4">
                {activities.slice(0, 6).map((activity) => (
                  <li
                    key={activity.id}
                    className="border-b border-rule-soft/60 pb-3.5 last:border-0 last:pb-0"
                  >
                    <p className="text-sm font-medium leading-relaxed text-ink-muted">
                      {activity.description}
                    </p>
                    <p className="mt-1 font-mono text-[0.625rem] uppercase tracking-[0.1em] text-ink-faint">
                      {formatDateTime(activity.createdAt)}
                    </p>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-4 text-sm text-ink-muted">Belum ada aktivitas tercatat.</p>
            )}
          </section>

          {/* Quick System Note */}
          <div className="rounded-2xl border border-rule-soft bg-canvas-sunk/60 p-5">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-sage" />
              <p className="font-mono text-xs font-bold uppercase tracking-wider text-ink">
                Sistem Youth MS Aktif
              </p>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-ink-muted">
              Data tersinkronisasi dengan aman. Segala perubahan yang kamu lakukan tercatat di sistem audit log.
            </p>
            <Link
              href="/dashboard/settings"
              className="mt-3 inline-block font-mono text-xs text-accent hover:underline"
            >
              Lihat status pengaturan &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
