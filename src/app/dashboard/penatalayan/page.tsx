import Link from "next/link";
import type { Metadata } from "next";
import { AlertTriangle, ClipboardList } from "lucide-react";
import {
  getEvents,
  getProfiles,
  getStewardsByEvent,
  getMyRole,
  getProfileCrossNames,
} from "@/lib/data";
import {
  FATIGUE_THRESHOLD,
  FATIGUE_WINDOW_DAYS,
} from "@/lib/fatigue";
import { PageHeader, EmptyState, SectionTitle } from "@/components/page-parts";
import { isOverloaded } from "@/lib/fatigue";
import { isCommittee } from "@/lib/roles";
import {
  formatDayNumber,
  formatMonthShort,
  formatWeekdayDayMonth,
} from "@/lib/datetime";
import { PenatalayanBoard, type BoardColumn } from "@/components/PenatalayanBoard";

export const metadata: Metadata = { title: "Papan Penatalayan" };

/** Cermin spreadsheet tim ibadah: 4 riwayat ke belakang + 6 rencana. */
const MAX_PAST = 4;
const MAX_UPCOMING = 6;

/**
 * Papan Penatalayan — halaman ini server (data), gridnya
 * <PenatalayanBoard> (interaksi: semua ↔ fokus-banding).
 */
export default async function PenatalayanPage() {
  const [events, profiles, role, crossNames] = await Promise.all([
    getEvents(),
    getProfiles(),
    getMyRole(),
    getProfileCrossNames(),
  ]);

  // Server component: renders once per request, so "now" is stable here.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const upcoming = events
    .filter((e) => new Date(e.date).getTime() >= now)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, MAX_UPCOMING);
  const past = events
    .filter((e) => new Date(e.date).getTime() < now)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, MAX_PAST)
    .reverse();

  const ordered = [...past, ...upcoming];
  const stewardsPerEvent = await Promise.all(
    ordered.map((e) => getStewardsByEvent(e.id))
  );

  const columns: BoardColumn[] = ordered.map((e, i) => ({
    id: e.id,
    dayNum: formatDayNumber(e.date),
    monthShort: formatMonthShort(e.date),
    weekdayLabel: formatWeekdayDayMonth(e.date),
    theme: e.weeklyTheme,
    eventLabel: formatWeekdayDayMonth(e.date),
    isPast: new Date(e.date).getTime() < now,
    stewards: (stewardsPerEvent[i] ?? []).map((s) => ({
      id: s.id,
      profileId: s.profileId,
      role: s.role,
      status: s.status,
    })),
  }));

  const canManage = isCommittee(role);

  const loaded = profiles
    .filter((p) => p.serviceCount30d > 0)
    .sort((a, b) => b.serviceCount30d - a.serviceCount30d);

  return (
    <div className="px-5 py-7 sm:px-8 sm:py-9">
      <PageHeader
        kicker="PERENCANAAN"
        title="Papan Penatalayan"
        meta={`${upcoming.length} Sabtu mendatang · ${past.length} riwayat`}
      />

      {columns.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="Belum ada ibadah terjadwal"
            body="Tambahkan jadwal dulu di halaman Ibadah — papan ini terisi sendiri begitu ada Sabtu yang terjadwal."
            icon={ClipboardList}
            action={
              <Link href="/dashboard/gatherings" className="btn-primary text-sm">
                Ke halaman Ibadah
              </Link>
            }
          />
        </div>
      ) : (
        <>
          <section aria-labelledby="papan-heading" className="mt-8">
            <SectionTitle id="papan-heading" title="Papan" />
            <div className="mt-4">
              <PenatalayanBoard
                columns={columns}
                profiles={profiles}
                crossNames={crossNames}
                canManage={canManage}
              />
            </div>
          </section>

          <section aria-labelledby="beban-heading" className="mt-10">
            <SectionTitle
              id="beban-heading"
              title="Beban 30 hari"
              meta={`>${FATIGUE_THRESHOLD}× = istirahatkan`}
            />
            {loaded.length === 0 ? (
              <p className="mt-4 text-sm text-ink-muted">
                Belum ada yang tercatat pelayanan 30 hari terakhir.
              </p>
            ) : (
              <>
                <ul className="mt-3 grid grid-cols-2 gap-x-6 lg:grid-cols-4">
                  {loaded.map((p) => {
                    const hot = isOverloaded(p.serviceCount30d);
                    return (
                      <li
                        key={p.id}
                        className="flex items-baseline justify-between gap-2 border-b border-rule-soft py-2.5"
                      >
                        <span className="min-w-0 truncate text-sm text-ink">{p.nickname}</span>
                        <span
                          className={`num inline-flex shrink-0 items-center gap-1 font-mono text-sm ${
                            hot ? "text-warning" : "text-ink-muted"
                          }`}
                        >
                          {p.serviceCount30d}&times;
                          {hot && (
                            <>
                              <AlertTriangle className="h-3.5 w-3.5 self-center" aria-hidden="true" />
                              <span className="sr-only">beban tinggi</span>
                            </>
                          )}
                        </span>
                      </li>
                    );
                  })}
                </ul>
                <p className="mt-3 flex items-center gap-1.5 text-xs text-ink-muted">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  = sudah lebih dari {FATIGUE_THRESHOLD}&times; dalam {FATIGUE_WINDOW_DAYS} hari. Tetap
                  bisa dipilih — utamakan yang lebih ringan.
                </p>
              </>
            )}
          </section>
        </>
      )}
    </div>
  );
}
