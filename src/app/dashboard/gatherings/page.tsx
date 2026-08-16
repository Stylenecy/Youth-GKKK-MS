import Link from "next/link";
import type { Metadata } from "next";
import { ChevronRight } from "lucide-react";
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

export const metadata: Metadata = { title: "Ibadah" };

const STATUS: Record<string, { label: string; cls: string }> = {
  published: { label: "Terjadwal", cls: "tag tag-sage" },
  draft: { label: "Rencana", cls: "tag" },
  completed: { label: "Selesai", cls: "tag" },
  archived: { label: "Arsip", cls: "tag" },
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
        kicker="Jadwal"
        title="Ibadah"
        meta={`${upcoming.length} akan datang · ${past.length} sudah lewat`}
        action={<CreateEventForm profiles={profiles} />}
      />

      {events.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="Belum ada jadwal"
            body="Tambahkan ibadah pertama lewat tombol di atas. Jadwal yang sudah dibuat akan muncul di halaman depan."
          />
        </div>
      ) : (
        <>
          <Section
            id="akan-datang"
            title="Akan datang"
            events={upcoming}
            nameOf={nameOf}
            empty="Tidak ada ibadah terjadwal setelah hari ini."
          />
          <Section
            id="sudah-berlangsung"
            title="Sudah berlangsung"
            events={past}
            nameOf={nameOf}
            empty="Belum ada riwayat ibadah."
            muted
          />
        </>
      )}
    </div>
  );
}

function Section({
  id,
  title,
  events,
  nameOf,
  empty,
  muted = false,
}: {
  id: string;
  title: string;
  events: Awaited<ReturnType<typeof getEvents>>;
  nameOf: (id: string) => string;
  empty: string;
  muted?: boolean;
}) {
  return (
    <section className="mt-9" aria-labelledby={`sec-${id}`}>
      <h2
        id={`sec-${id}`}
        className="font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-ink-faint"
      >
        {title}
      </h2>

      {events.length === 0 ? (
        <p className="mt-3 text-sm text-ink-muted">{empty}</p>
      ) : (
        <ul className="mt-3 border-t border-rule">
          {events.map((event) => {
            const s = STATUS[event.status] ?? STATUS.draft;
            return (
              <li key={event.id}>
                <Link
                  href={`/dashboard/gatherings/${event.id}`}
                  className="flex items-center gap-4 border-b border-rule py-4 transition-colors hover:bg-canvas-sunk sm:gap-6"
                >
                  <div
                    className={`flex w-12 shrink-0 flex-col items-center ${muted ? "opacity-60" : ""}`}
                  >
                    <span className="num font-serif text-2xl font-semibold leading-none text-ink">
                      {formatDayNumber(event.date)}
                    </span>
                    <span className="mt-0.5 font-mono text-[0.5625rem] uppercase tracking-[0.12em] text-ink-faint">
                      {formatMonthShort(event.date)}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-serif text-lg font-semibold text-ink">
                      {event.weeklyTheme}
                    </h3>
                    <p className="mt-0.5 truncate text-sm text-ink-muted">
                      {formatWeekdayDayMonth(event.date)} · {formatTime(event.date)}
                      {" · PIC "}
                      {nameOf(event.picId)}
                    </p>
                  </div>

                  <div className="hidden shrink-0 items-center gap-2 sm:flex">
                    <span className="tag">{eventTypeLabel(event.eventType)}</span>
                    <span className={s.cls}>{s.label}</span>
                  </div>

                  <ChevronRight
                    className="h-4 w-4 shrink-0 text-ink-faint"
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
