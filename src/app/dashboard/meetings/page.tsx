import Link from "next/link";
import type { Metadata } from "next";
import { ChevronRight, FileText, Users } from "lucide-react";
import { getMeetings } from "@/lib/data";
import { PageHeader, EmptyState, SectionTitle, CARD_LINK } from "@/components/page-parts";
import { formatWeekdayDayMonth, formatTime } from "@/lib/datetime";

export const metadata: Metadata = { title: "Notulen Rapat" };

export default async function MeetingsPage() {
  const meetings = await getMeetings();

  const sorted = [...meetings].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="px-5 py-7 sm:px-8 sm:py-9">
      <PageHeader
        kicker="DOKUMENTASI"
        title="Notulen & Risalah Rapat"
        meta={`${meetings.length} notulen tersimpan`}
        description="Keputusan rapat pengurus dicatat di sini supaya bisa ditelusuri lagi, tidak tenggelam di riwayat chat."
      />

      {sorted.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="Belum ada notulen rapat"
            body="Keputusan dan pembahasan rapat pengurus yang dicatat di sini dapat ditelusuri kembali setiap saat tanpa hilang di riwayat obrolan chat."
            icon={FileText}
          />
        </div>
      ) : (
        <div className="mt-8">
          <div className="mb-4">
            <SectionTitle title="Riwayat notulen pengurus" meta={<>{sorted.length} notulen</>} />
          </div>

          <ul className="grid gap-3 sm:grid-cols-2">
            {sorted.map((meeting) => (
              <li key={meeting.id}>
                <Link
                  href={`/dashboard/meetings/${meeting.id}`}
                  className={`group flex h-full flex-col justify-between p-5 sm:p-6 ${CARD_LINK}`}
                >
                  <div>
                    <div className="lp-meta flex items-center justify-between gap-3">
                      <span className="text-ink-muted">{formatWeekdayDayMonth(meeting.date)}</span>
                      <span>{formatTime(meeting.date)}</span>
                    </div>

                    <h2 className="mt-3 font-serif text-xl font-normal text-ink transition-colors group-hover:text-accent">
                      {meeting.title}
                    </h2>
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-rule-soft pt-3.5 text-xs text-ink-muted">
                    <span className="lp-meta flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" aria-hidden="true" />
                      {meeting.participants.length}&nbsp;orang hadir
                    </span>
                    <span className="flex items-center gap-1 font-semibold text-ink-muted transition-colors group-hover:text-accent">
                      Buka risalah <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
