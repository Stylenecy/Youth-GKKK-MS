import Link from "next/link";
import type { Metadata } from "next";
import { ChevronRight, FileText, Calendar, Users } from "lucide-react";
import { getMeetings } from "@/lib/data";
import { PageHeader, EmptyState } from "@/components/page-parts";
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
        meta={`${meetings.length} catatan notulen tersimpan · Keputusan penting terarsip secara transparan`}
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
          <div className="flex items-center justify-between border-b border-rule-soft pb-3 mb-6">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              <h2 className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-accent">
                ( RIWAYAT NOTULEN PENGURUS )
              </h2>
            </div>
            <span className="font-mono text-xs text-ink-faint">
              {sorted.length} Notulen
            </span>
          </div>

          <ul className="grid gap-3 sm:grid-cols-2">
            {sorted.map((meeting) => (
              <li key={meeting.id}>
                <Link
                  href={`/dashboard/meetings/${meeting.id}`}
                  className="group relative flex h-full flex-col justify-between rounded-2xl border border-line/40 bg-surface/75 p-5 sm:p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-accent hover:bg-surface hover:shadow-[0_12px_32px_rgba(253,190,2,0.12)]"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs font-mono text-ink-faint">
                      <span className="text-accent font-bold">
                        {formatWeekdayDayMonth(meeting.date)}
                      </span>
                      <span>{formatTime(meeting.date)} WIB</span>
                    </div>

                    <h2 className="mt-3 font-serif text-xl font-bold text-ink group-hover:text-accent transition-colors">
                      {meeting.title}
                    </h2>
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-rule-soft pt-3.5 text-xs text-ink-muted">
                    <span className="flex items-center gap-1.5 font-mono">
                      <Users className="h-3.5 w-3.5 text-accent" />
                      {meeting.participants.length} Orang Hadir
                    </span>
                    <span className="flex items-center gap-1 text-accent font-semibold group-hover:translate-x-1 transition-transform">
                      Buka Risalah <ChevronRight className="h-3.5 w-3.5" />
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
