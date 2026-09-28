import type { Metadata } from "next";
import { ClipboardList } from "lucide-react";
import {
  getEvents,
  getProfiles,
  getStewardsByEvent,
  getMySessionInfo,
  getProfileCrossNames,
} from "@/lib/data";
import {
  FATIGUE_THRESHOLD,
  FATIGUE_WINDOW_DAYS,
} from "@/lib/fatigue";
import { PageHeader, EmptyState, Monogram } from "@/components/page-parts";
import { isOverloaded } from "@/lib/fatigue";
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
  const [events, profiles, session, crossNames] = await Promise.all([
    getEvents(),
    getProfiles(),
    getMySessionInfo(),
    getProfileCrossNames(),
  ]);

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

  const canManage =
    !session ||
    session.appRole === "admin" ||
    session.appRole === "treasurer" ||
    session.appRole === "ministry";

  const loaded = profiles
    .filter((p) => p.serviceCount30d > 0)
    .sort((a, b) => b.serviceCount30d - a.serviceCount30d);

  return (
    <div className="px-5 py-7 sm:px-8 sm:py-9">
      <PageHeader
        kicker="PERENCANAAN"
        title="Papan Penatalayan"
        meta={`${past.length} riwayat · ${upcoming.length} mendatang · merah = sudah >${FATIGUE_THRESHOLD}× dalam ${FATIGUE_WINDOW_DAYS} hari`}
      />

      {columns.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="Belum ada ibadah terjadwal"
            body="Tambahkan jadwal dulu di halaman Ibadah — papan ini terisi sendiri begitu ada Sabtu yang terjadwal."
            icon={ClipboardList}
          />
        </div>
      ) : (
        <>
          <section aria-labelledby="beban-heading" className="mt-8">
            <div className="flex items-center gap-2 border-b border-rule-soft pb-3">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              <h2
                id="beban-heading"
                className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-accent"
              >
                ( BEBAN 30 HARI )
              </h2>
            </div>
            {loaded.length === 0 ? (
              <p className="mt-4 text-sm text-ink-muted">
                Belum ada yang tercatat pelayanan 30 hari terakhir.
              </p>
            ) : (
              <ul className="mt-4 flex flex-wrap gap-2">
                {loaded.map((p) => {
                  const hot = isOverloaded(p.serviceCount30d);
                  return (
                    <li
                      key={p.id}
                      title={`${p.fullName} — ${p.serviceCount30d}× dalam 30 hari`}
                      className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${
                        hot
                          ? "border-danger/50 bg-danger-wash/60 text-danger"
                          : "border-line/50 bg-surface/70 text-ink-muted"
                      }`}
                    >
                      <Monogram name={p.nickname} size="sm" />
                      <span className="max-w-24 truncate font-semibold text-ink">
                        {p.nickname}
                      </span>
                      <span className="num font-mono font-bold">
                        {p.serviceCount30d}&times;
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section aria-labelledby="papan-heading" className="mt-10">
            <div className="flex items-center gap-2 border-b border-rule-soft pb-3">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              <h2
                id="papan-heading"
                className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-accent"
              >
                ( PAPAN )
              </h2>
            </div>

            <div className="mt-4">
              <PenatalayanBoard
                columns={columns}
                profiles={profiles}
                crossNames={crossNames}
                canManage={canManage}
              />
            </div>
          </section>
        </>
      )}
    </div>
  );
}
