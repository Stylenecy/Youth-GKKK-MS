import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getMeetingById, getProfiles } from "@/lib/data";
import { PageHeader, BackLink, Monogram } from "@/components/page-parts";
import { formatFullDate, formatTime } from "@/lib/datetime";
import { FileText, Users, CheckCircle2 } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const meeting = await getMeetingById(id);
  return { title: meeting?.title ? `${meeting.title} · Notulen` : "Notulen Rapat" };
}

export default async function MeetingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const meeting = await getMeetingById(id);
  if (!meeting) notFound();

  const profiles = await getProfiles();
  const participants = meeting.participants
    .map((pid) => profiles.find((p) => p.id === pid))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  let agenda: string[] = [];
  try {
    const parsed = JSON.parse(meeting.content) as { agenda?: string[] };
    agenda = parsed.agenda ?? [];
  } catch {
    agenda = [];
  }

  return (
    <div className="px-5 py-7 sm:px-8 sm:py-9">
      <BackLink href="/dashboard/meetings">Kembali ke daftar notulen</BackLink>

      <div className="mt-3">
        <PageHeader
          kicker="RISALAH RAPAT"
          title={meeting.title}
          meta={`${formatFullDate(meeting.date)} · Pukul ${formatTime(meeting.date)} WIB`}
        />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.6fr_1fr]">
        {/* Main Section: Agenda & Decisions */}
        <section
          aria-labelledby="agenda-heading"
          className="rounded-2xl border border-line/40 bg-surface/75 p-6 backdrop-blur-xl shadow-sm"
        >
          <div className="flex items-center gap-2 border-b border-rule-soft pb-3 mb-4">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            <h2
              id="agenda-heading"
              className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-accent"
            >
              ( POKOK BAHASAN & AGENDA )
            </h2>
          </div>

          {agenda.length === 0 ? (
            <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
              Tidak ada rincian agenda poin khusus yang dicatat untuk pertemuan ini.
            </p>
          ) : (
            <ol className="divide-y divide-rule-soft/60">
              {agenda.map((item, i) => (
                <li
                  key={item}
                  className="flex items-start gap-4 py-4 first:pt-2 last:pb-2"
                >
                  <span className="num font-mono text-xs font-bold text-accent rounded-full border border-line-accent/40 bg-accent-wash px-2.5 py-1 shrink-0">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p className="text-sm sm:text-base leading-relaxed text-ink pt-0.5">
                    {item}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </section>

        {/* Aside: Participants list */}
        <aside className="space-y-6">
          <div className="rounded-2xl border border-line/40 bg-surface/75 p-6 backdrop-blur-xl shadow-sm">
            <div className="flex items-center gap-2 border-b border-rule-soft pb-3 mb-4">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              <h2 className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-accent">
                ( PESERTA HADIR — {participants.length} ORANG )
              </h2>
            </div>

            {participants.length === 0 ? (
              <p className="text-xs text-ink-muted">
                Daftar kehadiran peserta tidak tercatat.
              </p>
            ) : (
              <ul className="grid gap-2.5">
                {participants.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center gap-3 rounded-xl border border-line/40 bg-canvas-sunk/60 p-2.5"
                  >
                    <Monogram name={p.nickname} size="sm" />
                    <div>
                      <p className="font-serif text-sm font-semibold text-ink">
                        {p.nickname}
                      </p>
                      <p className="font-mono text-[0.625rem] text-ink-faint">
                        {p.fullName}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
