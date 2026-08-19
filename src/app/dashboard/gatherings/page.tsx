import Link from "next/link";
import type { Metadata } from "next";
import { ChevronRight, Calendar, Sparkles } from "lucide-react";
import { getEvents, getProfiles } from "@/lib/data";
import { CreateEventForm } from "@/components/CreateEventForm";
import { PageHeader, EmptyState } from "@/components/page-parts";
import {
  formatWeekdayDayMonth,
  formatDayNumber,
  formatMonthShort,
  formatTime,
  eventTypeLabel,
} from "@/lib/datetime";

export const metadata: Metadata = { title: "Jadwal Ibadah" };

const STATUS: Record<string, { label: string; cls: string }> = {
  published: { label: "Terjadwal", cls: "tag tag-sage font-medium" },
  draft: { label: "Rencana", cls: "tag font-medium" },
  completed: { label: "Selesai", cls: "tag font-medium opacity-80" },
  archived: { label: "Arsip", cls: "tag font-medium opacity-60" },
};

export default async function GatheringsPage() {
  const [events, profiles] = await Promise.all([getEvents(), getProfiles()]);

  const now = Date.now();
  const sorted = [...events].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  const upcoming = sorted
    .filter((e) => new Date(e.date).getTime() >= now)
    .reverse();
  const past = sorted.filter((e) => new Date(e.date).getTime() < now);

  const nameOf = (id: string) =>
    profiles.find((p) => p.id === id)?.nickname ?? "—";

  return (
    <div className="px-5 py-7 sm:px-8 sm:py-9">
      <PageHeader
        kicker="PELAYANAN"
        title="Jadwal Ibadah"
        meta={`${upcoming.length} ibadah mendatang · ${past.length} riwayat terlaksana`}
        action={<CreateEventForm profiles={profiles} />}
      />

      {events.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="Belum ada jadwal ibadah"
            body="Tambahkan jadwal ibadah pertama untuk mulai menugaskan penatalayan dan mengumumkan tema mingguan."
            icon={Calendar}
          />
        </div>
      ) : (
        <div className="mt-8 space-y-10">
          <GatheringSection
            id="akan-datang"
            kicker="MENDATANG"
            title="Ibadah Akan Datang"
            events={upcoming}
            nameOf={nameOf}
            empty="Tidak ada ibadah terjadwal setelah hari ini."
          />

          <GatheringSection
            id="sudah-berlangsung"
            kicker="ARSIP"
            title="Riwayat Ibadah Sebelumnya"
            events={past}
            nameOf={nameOf}
            empty="Belum ada riwayat ibadah sebelumnya."
            muted
          />
        </div>
      )}
    </div>
  );
}

function GatheringSection({
  id,
  kicker,
  title,
  events,
  nameOf,
  empty,
  muted = false,
}: {
  id: string;
  kicker: string;
  title: string;
  events: Awaited<ReturnType<typeof getEvents>>;
  nameOf: (id: string) => string;
  empty: string;
  muted?: boolean;
}) {
  return (
    <section aria-labelledby={`sec-${id}`}>
      <div className="flex items-center justify-between border-b border-rule-soft pb-3">
        <div className="flex items-center gap-2">
          <span className={`h-1.5 w-1.5 rounded-full ${muted ? "bg-ink-faint" : "bg-accent"}`} />
          <h2
            id={`sec-${id}`}
            className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-accent"
          >
            ( {kicker} )
          </h2>
          <span className="text-sm font-semibold text-ink-muted">· {title}</span>
        </div>
        <span className="font-mono text-xs text-ink-faint">
          {events.length} Sesi
        </span>
      </div>

      {events.length === 0 ? (
        <p className="mt-4 text-sm text-ink-muted leading-relaxed">{empty}</p>
      ) : (
        <ul className="mt-4 divide-y divide-rule-soft/60 rounded-2xl border border-line/40 bg-surface/60 backdrop-blur-xl overflow-hidden shadow-sm">
          {events.map((event) => {
            const s = STATUS[event.status] ?? STATUS.draft;
            return (
              <li key={event.id}>
                <Link
                  href={`/dashboard/gatherings/${event.id}`}
                  className="group flex items-center gap-4 p-4.5 transition-all duration-200 hover:bg-surface hover:pl-5 sm:gap-6 sm:p-5"
                >
                  {/* Calendar Box Badge */}
                  <div
                    className={`flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl border border-line-accent/40 bg-gradient-to-b from-surface-2 to-canvas-sunk p-1 shadow-sm transition-all duration-300 group-hover:border-accent group-hover:shadow-[0_0_14px_rgba(253,190,2,0.2)] ${
                      muted ? "opacity-60" : ""
                    }`}
                  >
                    <span className="num font-serif text-2xl font-bold leading-none text-ink group-hover:text-accent transition-colors">
                      {formatDayNumber(event.date)}
                    </span>
                    <span className="mt-0.5 font-mono text-[0.625rem] uppercase font-bold tracking-[0.14em] text-accent">
                      {formatMonthShort(event.date)}
                    </span>
                  </div>

                  {/* Title & Details */}
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-serif text-lg font-bold text-ink group-hover:text-accent transition-colors">
                      {event.weeklyTheme}
                    </h3>
                    <p className="mt-1 truncate text-xs text-ink-muted sm:text-sm">
                      {formatWeekdayDayMonth(event.date)} · {formatTime(event.date)} WIB
                      {" · PIC: "}
                      <span className="font-medium text-ink">{nameOf(event.picId)}</span>
                      {event.speakerName && (
                        <span> · Pembicara: {event.speakerName}</span>
                      )}
                    </p>
                  </div>

                  {/* Tags */}
                  <div className="hidden shrink-0 items-center gap-2 sm:flex">
                    <span className="tag border-line text-ink-muted">{eventTypeLabel(event.eventType)}</span>
                    <span className={s.cls}>{s.label}</span>
                  </div>

                  <ChevronRight
                    className="h-4 w-4 shrink-0 text-ink-faint transition-all duration-200 group-hover:translate-x-1 group-hover:text-accent"
                    aria-hidden="true"
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
