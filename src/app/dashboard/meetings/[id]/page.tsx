import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getMeetingById, getProfiles } from "@/lib/data";
import { PageHeader, BackLink } from "@/components/page-parts";
import { formatFullDate, formatTime } from "@/lib/datetime";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const meeting = await getMeetingById(id);
  return { title: meeting?.title ?? "Rapat" };
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
      <BackLink href="/dashboard/meetings">Kembali ke rapat</BackLink>

      <div className="mt-2">
        <PageHeader
          kicker="Notulen"
          title={meeting.title}
          meta={`${formatFullDate(meeting.date)} · ${formatTime(meeting.date)}`}
        />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.5fr_1fr]">
        <section aria-labelledby="agenda-heading">
          <h2
            id="agenda-heading"
            className="font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-ink-faint"
          >
            Agenda
          </h2>
          {agenda.length === 0 ? (
            <p className="mt-3 text-sm text-ink-muted">
              Tidak ada agenda yang tercatat untuk rapat ini.
            </p>
          ) : (
            <ol className="mt-3 border-t border-rule">
              {agenda.map((item, i) => (
                <li
                  key={item}
                  className="flex gap-3.5 border-b border-rule py-3.5"
                >
                  <span className="num mt-0.5 font-mono text-[0.6875rem] text-accent">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-[0.9375rem] leading-relaxed text-ink">
                    {item}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>

        <aside>
          <h2 className="font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-ink-faint">
            Peserta ({participants.length})
          </h2>
          {participants.length === 0 ? (
            <p className="mt-3 text-sm text-ink-muted">
              Peserta tidak tercatat.
            </p>
          ) : (
            <ul className="mt-3 flex flex-wrap gap-2">
              {participants.map((p) => (
                <li key={p.id} className="card-sunk px-3 py-1.5 text-sm text-ink">
                  {p.nickname}
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </div>
  );
}
