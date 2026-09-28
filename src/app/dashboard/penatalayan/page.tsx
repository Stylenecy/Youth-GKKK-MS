import Link from "next/link";
import type { Metadata } from "next";
import { ClipboardList } from "lucide-react";
import {
  getEvents,
  getProfiles,
  getStewardsByEvent,
  getMySessionInfo,
} from "@/lib/data";
import {
  isOverloaded,
  FATIGUE_THRESHOLD,
  FATIGUE_WINDOW_DAYS,
} from "@/lib/fatigue";
import { STEWARD_ROLES } from "@/lib/validation";
import { PageHeader, EmptyState, Monogram } from "@/components/page-parts";
import { AssignStewardForm } from "@/components/AssignStewardForm";
import {
  formatDayNumber,
  formatMonthShort,
  formatWeekdayDayMonth,
} from "@/lib/datetime";

export const metadata: Metadata = { title: "Papan Penatalayan" };

/** Berapa Sabtu ke depan yang muat di papan. Spreadsheet tim ibadah
 *  biasanya merencanakan sebulan — 6 kolom cukup tanpa scroll gila. */
const MAX_COLUMNS = 6;

/**
 * Papan Penatalayan — cermin spreadsheet tim ibadah (Grace & Nita).
 *
 * Baris = 6 peran, kolom = Sabtu ibadah mendatang. Satu pandang harus
 * menjawab: "si X sudah pelayanan berapa kali, aman ditugaskan lagi?"
 * Sel merah = orang itu sudah > ambang 30 hari. Isi lewat tombol per
 * kolom (pakai AssignStewardForm yang sama dengan halaman detail).
 * Fase 2 (saran otomatis/acak/AI) SENGAJA belum ada — lihat PROJECT_MASTER.
 */
export default async function PenatalayanPage() {
  const [events, profiles, session] = await Promise.all([
    getEvents(),
    getProfiles(),
    getMySessionInfo(),
  ]);

  const now = Date.now();
  const upcoming = events
    .filter((e) => new Date(e.date).getTime() >= now)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, MAX_COLUMNS);

  const stewardsPerEvent = await Promise.all(
    upcoming.map((e) => getStewardsByEvent(e.id))
  );

  // Tombol isi hanya untuk pengurus (RLS events = committee). Sisanya
  // dapat papan baca. Demo (session null) tetap full preview.
  const canManage =
    !session ||
    session.appRole === "admin" ||
    session.appRole === "treasurer" ||
    session.appRole === "ministry";

  const byId = new Map(profiles.map((p) => [p.id, p]));
  const loadOf = (profileId: string) => byId.get(profileId)?.serviceCount30d ?? 0;
  const nameOf = (profileId: string) =>
    byId.get(profileId)?.nickname ?? "—";

  const loaded = profiles
    .filter((p) => p.serviceCount30d > 0)
    .sort((a, b) => b.serviceCount30d - a.serviceCount30d);

  return (
    <div className="px-5 py-7 sm:px-8 sm:py-9">
      <PageHeader
        kicker="PERENCANAAN"
        title="Papan Penatalayan"
        meta={`${upcoming.length} Sabtu ke depan · merah = sudah >${FATIGUE_THRESHOLD}× dalam ${FATIGUE_WINDOW_DAYS} hari`}
      />

      {upcoming.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="Belum ada ibadah mendatang"
            body="Tambahkan jadwal dulu di halaman Ibadah — papan ini terisi sendiri begitu ada Sabtu yang terjadwal."
            icon={ClipboardList}
          />
        </div>
      ) : (
        <>
          {/* Beban 30 hari: siapa sudah berapa kali, sekilas */}
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

          {/* Grid peran × Sabtu */}
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

            <div className="mt-4 overflow-x-auto rounded-2xl border border-line/40 bg-surface/60 backdrop-blur-xl shadow-sm">
              <table className="w-full min-w-[720px] border-collapse text-sm">
                <thead>
                  <tr>
                    <th
                      scope="col"
                      className="sticky left-0 bg-surface p-4 text-left font-mono text-xs font-bold uppercase tracking-[0.16em] text-ink-muted"
                    >
                      Peran
                    </th>
                    {upcoming.map((e, i) => (
                      <th key={e.id} scope="col" className="min-w-44 p-4 text-left align-top">
                        <Link
                          href={`/dashboard/gatherings/${e.id}`}
                          className="group block rounded-xl transition-colors hover:bg-surface-2/60 p-1 -m-1"
                        >
                          <span className="flex items-baseline gap-2">
                            <span className="num font-serif text-2xl font-bold text-ink group-hover:text-accent">
                              {formatDayNumber(e.date)}
                            </span>
                            <span className="font-mono text-xs font-bold uppercase text-accent">
                              {formatMonthShort(e.date)}
                            </span>
                          </span>
                          <span className="mt-1 block truncate text-xs font-semibold text-ink">
                            {e.weeklyTheme}
                          </span>
                          <span className="block text-[0.6875rem] text-ink-faint">
                            {formatWeekdayDayMonth(e.date)}
                          </span>
                        </Link>
                        {canManage && (
                          <div className="mt-2 [&_button]:text-xs [&_button]:px-3 [&_button]:py-1.5">
                            <AssignStewardForm eventId={e.id} profiles={profiles} />
                          </div>
                        )}
                        <span className="sr-only">{`Kolom ${i + 1}`}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {STEWARD_ROLES.map((role) => (
                    <tr key={role} className="border-t border-rule-soft/60">
                      <th
                        scope="row"
                        className="sticky left-0 bg-surface p-4 text-left font-mono text-xs font-bold uppercase tracking-[0.14em] text-accent"
                      >
                        {role}
                      </th>
                      {upcoming.map((e) => {
                        const stewards = (stewardsPerEvent[upcoming.indexOf(e)] ?? []).filter(
                          (s) => s.role === role && s.status !== "replaced"
                        );
                        return (
                          <td key={e.id} className="p-3 align-top">
                            {stewards.length === 0 ? (
                              <span className="text-ink-faint" aria-label={`Belum ada ${role}`}>
                                —
                              </span>
                            ) : (
                              <ul className="space-y-1.5">
                                {stewards.map((s) => {
                                  const hot = isOverloaded(loadOf(s.profileId));
                                  return (
                                    <li
                                      key={s.id}
                                      title={`${nameOf(s.profileId)} — ${loadOf(s.profileId)}× dalam 30 hari`}
                                      className={`flex items-center justify-between gap-2 rounded-lg border px-2.5 py-1.5 text-xs ${
                                        hot
                                          ? "border-danger/50 bg-danger-wash/60 font-semibold text-danger"
                                          : "border-line/40 bg-canvas-sunk/60 text-ink"
                                      }`}
                                    >
                                      <span className="truncate">
                                        {nameOf(s.profileId)}
                                      </span>
                                      <span className="num shrink-0 font-mono font-bold opacity-80">
                                        {loadOf(s.profileId)}&times;
                                      </span>
                                    </li>
                                  );
                                })}
                              </ul>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="mt-4 text-xs leading-relaxed text-ink-muted">
              Merah = orang itu sudah melayani &gt;{FATIGUE_THRESHOLD}&times; dalam{" "}
              {FATIGUE_WINDOW_DAYS} hari terakhir — pertimbangkan orang lain dulu.
              Angka dihitung dari tanggal ibadah. Klik tanggal untuk buka detail
              (ubah, arsip, absensi).
            </p>
          </section>
        </>
      )}
    </div>
  );
}
