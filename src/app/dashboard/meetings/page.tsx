import Link from "next/link";
import type { Metadata } from "next";
import { ChevronRight } from "lucide-react";
import { getMeetings } from "@/lib/data";
import { PageHeader, EmptyState } from "@/components/page-parts";
import { formatWeekdayDayMonth, formatTime } from "@/lib/datetime";

export const metadata: Metadata = { title: "Rapat" };

export default async function MeetingsPage() {
  const meetings = await getMeetings();

  const sorted = [...meetings].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="px-5 py-7 sm:px-8 sm:py-9">
      <PageHeader
        kicker="Catatan"
        title="Rapat"
        meta={`${meetings.length} notulen tersimpan`}
      />

      {sorted.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="Belum ada notulen"
            body="Keputusan rapat yang dicatat di sini bisa dicari kembali — tidak hilang di gulungan chat."
          />
        </div>
      ) : (
        <ul className="mt-8 border-t border-rule">
          {sorted.map((meeting) => (
            <li key={meeting.id}>
              <Link
                href={`/dashboard/meetings/${meeting.id}`}
                className="flex items-center gap-4 border-b border-rule py-4 transition-colors hover:bg-canvas-sunk"
              >
                <div className="min-w-0 flex-1">
                  <h2 className="truncate font-serif text-lg font-semibold text-ink">
                    {meeting.title}
                  </h2>
                  <p className="mt-0.5 truncate text-sm text-ink-muted">
                    {formatWeekdayDayMonth(meeting.date)} · {formatTime(meeting.date)}
                    {" · "}
                    {meeting.participants.length} peserta
                  </p>
                </div>
                <ChevronRight
                  className="h-4 w-4 shrink-0 text-ink-faint"
                  aria-hidden="true"
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
