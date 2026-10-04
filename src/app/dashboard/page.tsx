import Link from "next/link";
import type { Metadata } from "next";
import {
  Users,
  CalendarDays,
  Wallet,
  ArrowRight,
  Clock,
  ChevronRight,
  ClipboardList,
  NotebookPen,
  UsersRound,
  UserCog,
} from "lucide-react";
import {
  getDashboardStats,
  getUpcomingGathering,
  getFatigueAlerts,
  getRecentActivity,
  getProfiles,
  getMyRole,
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
import { FATIGUE_THRESHOLD, FATIGUE_WINDOW_DAYS } from "@/lib/fatigue";
import { serviceReadiness } from "@/lib/stewards";
import {
  isCommittee,
  canManageFinance,
  canViewAudit,
  ROLE_LABEL,
} from "@/lib/roles";
import {
  PageHeader,
  Panel,
  SectionTitle,
  EmptyState,
  Monogram,
} from "@/components/page-parts";

export const metadata: Metadata = { title: "Dashboard Pengurus" };

export default async function DashboardPage() {
  const role = await getMyRole();
  const committee = isCommittee(role);
  const finance = canManageFinance(role);
  const audit = canViewAudit(role);

  const [stats, upcoming, fatigueAlerts, activities, profiles] =
    await Promise.all([
      getDashboardStats(),
      getUpcomingGathering(),
      getFatigueAlerts(),
      // audit_logs is admin-only (RLS 0010): don't fetch what we won't show.
      audit ? getRecentActivity(6) : Promise.resolve([]),
      getProfiles(),
    ]);

  const nameOf = (id: string) =>
    profiles.find((p) => p.id === id)?.nickname ?? "—";

  const stewards = (upcoming?.stewardAssignments ?? []).filter(
    (s: StewardAssignment) => s.status !== "replaced"
  );
  const ready = serviceReadiness(stewards);
  const readiness = Math.round((ready.filled / ready.needed) * 100);
  const complete = ready.missing.length === 0;

  const statCards = [
    {
      kicker: "Anggota",
      label: "Total terdaftar",
      value: String(stats.totalMembers),
      href: "/dashboard/members",
    },
    {
      kicker: "Cross",
      label: "Kelompok aktif",
      value: String(stats.activeCrossGroups),
      href: "/dashboard/cross",
    },
    {
      kicker: "Ibadah",
      label: "Bulan ini",
      value: String(stats.monthGatherings),
      href: "/dashboard/gatherings",
    },
    // Saldo only for those who can open the cash book — for everyone else
    // RLS returns no rows and the card would claim "Rp 0".
    ...(finance
      ? [
          {
            kicker: "Kas",
            label: "Saldo kas",
            value: formatRupiahCompact(stats.totalBalance),
            href: "/dashboard/finance",
          },
        ]
      : []),
  ];

  const shortcuts = [
    ...(committee
      ? [
          { href: "/dashboard/penatalayan", label: "Papan Penatalayan", sub: "Isi petugas per Sabtu", icon: ClipboardList },
          { href: "/dashboard/gatherings", label: "Jadwal Ibadah", sub: "Tema, PIC, arsip", icon: CalendarDays },
        ]
      : [
          { href: "/dashboard/gatherings", label: "Jadwal Ibadah", sub: "Siapa melayani kapan", icon: CalendarDays },
        ]),
    { href: "/dashboard/cross/mine", label: "Kelompokku", sub: "Anggota Cross-mu", icon: UsersRound },
    { href: "/dashboard/members", label: "Data Anggota", sub: "Cari nama & Cross", icon: Users },
    ...(finance
      ? [{ href: "/dashboard/finance", label: "Catat Kas", sub: "Buku transaksi", icon: Wallet }]
      : []),
    { href: "/dashboard/meetings", label: "Notulen Rapat", sub: "Arsip keputusan", icon: NotebookPen },
  ];

  return (
    <div className="px-5 py-7 sm:px-8 sm:py-9">
      <PageHeader
        kicker="RINGKASAN MINGGU INI"
        title="Dashboard Pengurus"
        meta={`${formatFullDate(new Date())} · ${
          role ? `Masuk sebagai ${ROLE_LABEL[role]}` : "Mode demo"
        }`}
        action={
          committee ? (
            <Link href="/dashboard/penatalayan" className="btn-primary text-sm">
              <ClipboardList className="h-4 w-4" aria-hidden="true" />
              Atur Penatalayan
            </Link>
          ) : undefined
        }
      />

      {/* KPI cards */}
      <div
        className={`mt-8 grid grid-cols-2 gap-3.5 ${
          statCards.length === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3"
        }`}
      >
        {/* Numbers as the stage (house language): HUD corners, light mono
            figures, mono labels. Each tile is a real link to its page. */}
        {statCards.map((s) => (
          <Link
            key={s.kicker}
            href={s.href}
            className="lp-hud group flex flex-col justify-between px-4 pb-4 pt-5 transition-colors duration-200 hover:bg-surface sm:px-5"
          >
            <span className="flex items-center justify-between">
              <span className="lp-meta text-accent">{s.kicker}</span>
              <ChevronRight className="h-3.5 w-3.5 text-ink-faint group-hover:text-accent" aria-hidden="true" />
            </span>
            <span className="lp-num mt-5 block text-[clamp(2.25rem,1.6rem+2vw,3.5rem)] text-ink">
              {s.value}
            </span>
            <span className="lp-meta mt-3 block">{s.label}</span>
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-7 lg:grid-cols-3">
        <div className="space-y-7 lg:col-span-2">
          {/* Next service */}
          {upcoming ? (
            <Panel tone="accent" aria-labelledby="next-heading">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="inline-flex items-center gap-2 rounded-full border border-line-accent bg-accent-wash/80 px-3.5 py-1 lp-meta font-semibold text-accent">
                    <span className="h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
                    {countdownLabel(upcoming.date)}
                  </span>
                  <span className="tag border-line text-ink-muted">
                    {eventTypeLabel(upcoming.eventType)}
                  </span>
                </div>
                <span className="flex items-center gap-1.5 font-mono text-xs text-ink-muted">
                  <Clock className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
                  {formatTime(upcoming.date)}
                </span>
              </div>

              <h2
                id="next-heading"
                className="lp-title mt-5 text-[clamp(1.75rem,1.3rem+1.5vw,2.5rem)] text-ink"
              >
                {upcoming.weeklyTheme}
              </h2>
              <p className="lp-meta mt-3 text-ink-muted">
                {formatFullDate(upcoming.date)} · Ruang Hermon
              </p>

              {/* Readiness: slots per role, not a head count */}
              <div className="mt-6 rounded-xl border border-rule-soft bg-canvas-sunk/70 p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="lp-meta font-semibold text-accent">
                    <span className="lp-bracket">Kesiapan penatalayan</span>
                  </span>
                  <span className="num font-mono text-xs font-bold text-ink">
                    {ready.filled} / {ready.needed} slot
                  </span>
                </div>
                <div
                  className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-surface-2"
                  role="progressbar"
                  aria-valuenow={ready.filled}
                  aria-valuemin={0}
                  aria-valuemax={ready.needed}
                  aria-label="Slot penatalayan yang sudah terisi"
                >
                  <div
                    className={complete ? "h-full rounded-full bg-sage" : "meter-fill h-full rounded-full"}
                    style={{ width: `${readiness}%` }}
                  />
                </div>
                <p className={`mt-2.5 text-sm ${complete ? "text-sage" : "text-ink"}`}>
                  {complete
                    ? "Semua peran sudah terisi."
                    : `Masih kurang: ${ready.missing
                        .map((m) => `${m.role} ${m.count}`)
                        .join(" · ")}`}
                </p>
              </div>

              {stewards.length > 0 ? (
                <ul className="mt-5 grid gap-2.5 sm:grid-cols-2" aria-label="Petugas terjadwal">
                  {stewards.map((s: StewardAssignment) => (
                    <li
                      key={s.id}
                      className="flex items-center gap-3 rounded-xl border border-line/40 bg-canvas-sunk/60 px-3.5 py-2.5"
                    >
                      <Monogram name={nameOf(s.profileId)} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-ink">
                          {nameOf(s.profileId)}
                        </p>
                        <p className="lp-meta text-accent">
                          {s.role}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-5 rounded-xl border border-dashed border-rule bg-canvas-sunk/40 px-4 py-5 text-center text-sm text-ink-muted">
                  Belum ada petugas untuk ibadah ini.
                </p>
              )}

              <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-rule-soft pt-4">
                {committee && !complete && (
                  <Link href="/dashboard/penatalayan" className="btn-primary text-sm">
                    Isi yang kurang
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                )}
                <Link
                  href={`/dashboard/gatherings/${upcoming.id}`}
                  className="btn-quiet text-sm font-semibold"
                >
                  Detail ibadah
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </Panel>
          ) : (
            <EmptyState
              title="Belum ada ibadah terjadwal"
              body={
                committee
                  ? "Buat jadwal Sabtu berikutnya dulu — setelah itu papan penatalayan bisa diisi."
                  : "Jadwal berikutnya belum dibuat oleh pengurus."
              }
              icon={CalendarDays}
              action={
                committee ? (
                  <Link href="/dashboard/gatherings" className="btn-primary text-sm">
                    Buat jadwal ibadah
                  </Link>
                ) : undefined
              }
            />
          )}

          {/* Load warning */}
          {fatigueAlerts.length > 0 && (
            <Panel tone="warning" aria-labelledby="fatigue-heading">
              <SectionTitle
                id="fatigue-heading"
                title="Perlu istirahat"
                tone="warning"
                meta={`${fatigueAlerts.length} orang`}
              />
              <p className="mt-3 text-sm leading-relaxed text-ink-muted">
                Sudah melayani lebih dari {FATIGUE_THRESHOLD}&times; dalam{" "}
                {FATIGUE_WINDOW_DAYS} hari. Pertimbangkan orang lain dulu saat mengisi papan.
              </p>
              <ul className="mt-4 space-y-2.5">
                {fatigueAlerts.map((alert) => (
                  <li key={alert.member.id}>
                    <Link
                      href={`/dashboard/members/${alert.member.id}`}
                      className="flex min-h-[44px] items-center justify-between gap-3 rounded-xl border border-warning/30 bg-surface/80 px-4 py-2.5 transition-colors hover:border-warning"
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <Monogram name={alert.member.nickname} size="sm" />
                        <span className="truncate font-semibold text-ink">
                          {alert.member.nickname}
                        </span>
                      </span>
                      <span className="num shrink-0 font-mono text-xs font-bold text-warning">
                        {alert.serviceCount}&times; / {FATIGUE_WINDOW_DAYS} hari
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-7">
          <Panel aria-labelledby="shortcut-heading">
            <SectionTitle id="shortcut-heading" title="Pintasan" />
            <ul className="mt-3 divide-y divide-rule-soft/60">
              {shortcuts.map((a) => {
                const Icon = a.icon;
                return (
                  <li key={a.href}>
                    <Link
                      href={a.href}
                      className="group flex min-h-[52px] items-center gap-3 py-2.5"
                    >
                      <Icon className="h-[18px] w-[18px] shrink-0 text-ink-faint group-hover:text-accent" strokeWidth={1.9} aria-hidden="true" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-ink group-hover:text-accent">
                          {a.label}
                        </span>
                        <span className="block text-xs text-ink-muted">{a.sub}</span>
                      </span>
                      <ChevronRight className="h-4 w-4 text-ink-faint group-hover:text-accent" aria-hidden="true" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </Panel>

          {audit ? (
            <Panel aria-labelledby="activity-heading">
              <SectionTitle
                id="activity-heading"
                title="Aktivitas terakhir"
                action={
                  <Link
                    href="/dashboard/audit"
                    className="lp-meta text-ink-muted hover:text-accent"
                  >
                    Semua &rarr;
                  </Link>
                }
              />
              {activities.length > 0 ? (
                <ol className="mt-4 space-y-4">
                  {activities.map((activity) => (
                    <li
                      key={activity.id}
                      className="border-b border-rule-soft/60 pb-3.5 last:border-0 last:pb-0"
                    >
                      <p className="text-sm leading-relaxed text-ink">
                        {activity.description}
                      </p>
                      <p className="mt-1 font-mono text-[0.6875rem] text-ink-muted">
                        {formatDateTime(activity.createdAt)}
                      </p>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="mt-4 text-sm text-ink-muted">Belum ada aktivitas tercatat.</p>
              )}
            </Panel>
          ) : (
            <Panel tone="sunk" aria-labelledby="account-heading">
              <SectionTitle id="account-heading" title="Akunmu" />
              <p className="mt-3 flex items-center gap-2 text-sm text-ink">
                <UserCog className="h-4 w-4 text-accent" aria-hidden="true" />
                {role ? ROLE_LABEL[role] : "Mode demo"}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                Menu yang kamu lihat menyesuaikan peranmu. Kalau ada yang seharusnya bisa kamu buka tapi tidak muncul, hubungi admin.
              </p>
              <Link
                href="/dashboard/settings"
                className="mt-3 inline-flex min-h-[44px] items-center font-mono text-xs text-accent hover:underline"
              >
                Lihat akun &amp; keluar &rarr;
              </Link>
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}
