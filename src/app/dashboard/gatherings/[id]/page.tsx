import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getEventById, getProfiles, getStewardsByEvent } from "@/lib/data";
import type { StewardAssignment } from "@/lib/types";
import { PageHeader, BackLink, DataPoint, EmptyState } from "@/components/page-parts";
import { EditEventForm } from "@/components/EditEventForm";
import { ConfirmAction } from "@/components/ConfirmAction";
import { archiveEvent, restoreEvent } from "@/app/actions/gatherings";
import {
  formatFullDate,
  formatTime,
  countdownLabel,
  eventTypeLabel,
} from "@/lib/datetime";

const STEWARD_STATUS: Record<string, { label: string; cls: string }> = {
  confirmed: { label: "Sudah konfirmasi", cls: "tag tag-sage" },
  assigned: { label: "Menunggu konfirmasi", cls: "tag" },
  change_requested: { label: "Minta diganti", cls: "tag tag-warning" },
  replaced: { label: "Sudah diganti", cls: "tag" },
};

const EVENT_STATUS: Record<string, { label: string; cls: string }> = {
  published: { label: "Terjadwal", cls: "tag tag-sage" },
  draft: { label: "Rencana", cls: "tag" },
  completed: { label: "Selesai", cls: "tag" },
  archived: { label: "Arsip", cls: "tag" },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const event = await getEventById(id);
  return { title: event?.weeklyTheme ?? "Ibadah" };
}

export default async function GatheringDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await getEventById(id);
  if (!event) notFound();

  const [profiles, stewards] = await Promise.all([
    getProfiles(),
    getStewardsByEvent(id),
  ]);

  const pic = profiles.find((p) => p.id === event.picId);
  const status = EVENT_STATUS[event.status] ?? EVENT_STATUS.draft;
  const active = stewards.filter((s) => s.status !== "replaced");

  // Bound to this event's id so the client component stays a plain button.
  async function archiveThis() {
    "use server";
    return archiveEvent(id);
  }

  async function restoreThis() {
    "use server";
    return restoreEvent(id);
  }

  return (
    <div className="px-5 py-7 sm:px-8 sm:py-9">
      <BackLink href="/dashboard/gatherings">Kembali ke ibadah</BackLink>

      <div className="mt-2">
        <PageHeader
          kicker={eventTypeLabel(event.eventType)}
          title={event.weeklyTheme}
          meta={`${formatFullDate(event.date)} · ${formatTime(event.date)}`}
        />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <span className={status.cls}>{status.label}</span>
        <span className="tag">{countdownLabel(event.date)}</span>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-rule pt-5">
        <EditEventForm event={event} profiles={profiles} />
        {event.status === "archived" ? (
          <ConfirmAction
            label="Pulihkan"
            variant="outline"
            title="Pulihkan ibadah ini?"
            body="Ibadah akan kembali muncul sebagai rencana dan bisa dijadwalkan ulang."
            confirmLabel="Pulihkan"
            onConfirm={restoreThis}
          />
        ) : (
          <ConfirmAction
            label="Arsipkan"
            title="Arsipkan ibadah ini?"
            body="Ibadah akan hilang dari halaman depan dan agenda, tapi datanya tidak dihapus — kamu bisa memulihkannya kapan saja."
            confirmLabel="Arsipkan"
            onConfirm={archiveThis}
          />
        )}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.5fr_1fr]">
        <section aria-labelledby="stewards-heading">
          <h2
            id="stewards-heading"
            className="font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-ink-faint"
          >
            Penatalayan ({active.length})
          </h2>

          {stewards.length === 0 ? (
            <div className="mt-3">
              <EmptyState
                title="Belum ada yang ditugaskan"
                body="Tugaskan tim pelayanan supaya mereka punya waktu menyiapkan diri dan berlatih."
              />
            </div>
          ) : (
            <ul className="mt-3 border-t border-rule">
              {stewards.map((s: StewardAssignment) => {
                const member = profiles.find((p) => p.id === s.profileId);
                const st = STEWARD_STATUS[s.status] ?? STEWARD_STATUS.assigned;
                return (
                  <li
                    key={s.id}
                    className={`flex flex-wrap items-center justify-between gap-3 border-b border-rule py-3.5 ${
                      s.status === "replaced" ? "opacity-55" : ""
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="font-serif text-lg font-medium text-ink">
                        {member?.nickname ?? "—"}
                      </p>
                      <p className="mt-0.5 font-mono text-[0.625rem] uppercase tracking-[0.12em] text-ink-faint">
                        {s.role}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={st.cls}>{st.label}</span>
                      {s.reason && (
                        <span className="text-xs text-ink-muted">{s.reason}</span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <aside>
          <h2 className="font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-ink-faint">
            Keterangan
          </h2>
          <dl className="mt-3 space-y-1">
            <DataPoint label="Penanggung jawab" value={pic?.nickname ?? "—"} />
            <DataPoint label="Pembicara" value={event.speakerName || "—"} />
            <DataPoint label="Catatan" value={event.description || "—"} />
          </dl>
        </aside>
      </div>
    </div>
  );
}
