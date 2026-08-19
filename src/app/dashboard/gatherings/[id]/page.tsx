import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getEventById, getProfiles, getStewardsByEvent } from "@/lib/data";
import type { StewardAssignment } from "@/lib/types";
import { PageHeader, BackLink, DataPoint, EmptyState, Monogram } from "@/components/page-parts";
import { EditEventForm } from "@/components/EditEventForm";
import { ConfirmAction } from "@/components/ConfirmAction";
import { archiveEvent, restoreEvent } from "@/app/actions/gatherings";
import { eventStateLabel } from "@/lib/events";
import {
  formatFullDate,
  formatTime,
  countdownLabel,
  eventTypeLabel,
} from "@/lib/datetime";
import { Users, Clock, Calendar, Sparkles } from "lucide-react";

const STEWARD_STATUS: Record<string, { label: string; cls: string }> = {
  confirmed: { label: "Sudah konfirmasi", cls: "tag tag-sage font-medium" },
  assigned: { label: "Menunggu konfirmasi", cls: "tag font-medium" },
  change_requested: { label: "Minta diganti", cls: "tag tag-warning font-medium" },
  replaced: { label: "Sudah diganti", cls: "tag font-medium opacity-60" },
};


export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const event = await getEventById(id);
  return { title: event?.weeklyTheme ? `${event.weeklyTheme} · Ibadah` : "Detail Ibadah" };
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
  const status = eventStateLabel(event);
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
      <BackLink href="/dashboard/gatherings">Kembali ke daftar ibadah</BackLink>

      <div className="mt-3">
        <PageHeader
          kicker={eventTypeLabel(event.eventType)}
          title={event.weeklyTheme}
          meta={`${formatFullDate(event.date)} · ${formatTime(event.date)} WIB · Ruang Hermon`}
        />
      </div>

      {/* Status & Countdown Badges */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <span className={status.cls}>{status.label}</span>
        <div className="inline-flex items-center gap-2 rounded-full border border-line-accent bg-accent-wash/80 px-3.5 py-1 text-xs font-mono font-bold uppercase text-accent">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          {countdownLabel(event.date)}
        </div>
      </div>

      {/* Action Shelf */}
      <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-rule-soft pt-6">
        <EditEventForm event={event} profiles={profiles} />
        {event.status === "archived" ? (
          <ConfirmAction
            label="Pulihkan Ibadah"
            variant="outline"
            title="Pulihkan ibadah ini?"
            body="Ibadah akan kembali muncul sebagai rencana dan bisa dijadwalkan ulang."
            confirmLabel="Pulihkan"
            onConfirm={restoreThis}
          />
        ) : (
          <ConfirmAction
            label="Arsipkan Ibadah"
            title="Arsipkan ibadah ini?"
            body="Ibadah akan hilang dari halaman depan dan agenda publik, tapi datanya tetap tersimpan untuk audit dan bisa dipulihkan kapan saja."
            confirmLabel="Arsipkan"
            onConfirm={archiveThis}
          />
        )}
      </div>

      {/* Main Grid Content: Stewards Roster vs Metadata Details */}
      <div className="mt-8 grid gap-8 lg:grid-cols-[1.6fr_1fr]">
        {/* Stewards Roster Card */}
        <section
          aria-labelledby="stewards-heading"
          className="rounded-2xl border border-line/40 bg-surface/70 p-6 backdrop-blur-xl shadow-sm"
        >
          <div className="flex items-center justify-between border-b border-rule-soft pb-3">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              <h2
                id="stewards-heading"
                className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-accent"
              >
                ( Penatalayan Pelayanan )
              </h2>
            </div>
            <span className="font-mono text-xs text-ink-faint">
              {active.length} Petugas Terdaftar
            </span>
          </div>

          {stewards.length === 0 ? (
            <div className="mt-6">
              <EmptyState
                title="Belum ada penatalayan"
                body="Tugaskan tim pelayanan (WL, Singer, Pemusik, Multimedia, Usher) agar mereka memiliki cukup waktu untuk menyiapkan diri dan berlatih."
                icon={Users}
              />
            </div>
          ) : (
            <ul className="mt-4 divide-y divide-rule-soft/60">
              {stewards.map((s: StewardAssignment) => {
                const member = profiles.find((p) => p.id === s.profileId);
                const st = STEWARD_STATUS[s.status] ?? STEWARD_STATUS.assigned;
                return (
                  <li
                    key={s.id}
                    className={`flex flex-wrap items-center justify-between gap-4 py-4 first:pt-2 last:pb-2 transition-colors hover:bg-surface-2/40 px-2 rounded-xl ${
                      s.status === "replaced" ? "opacity-50 line-through" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <Monogram name={member?.nickname ?? "?"} size="md" />
                      <div className="min-w-0">
                        <p className="font-serif text-lg font-bold text-ink">
                          {member?.nickname ?? "—"}
                        </p>
                        <p className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-accent">
                          {s.role}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span className={st.cls}>{st.label}</span>
                      {s.reason && (
                        <span className="text-xs text-ink-muted italic">
                          Ket: {s.reason}
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Aside: Event Metadata & Speaker Details */}
        <aside className="space-y-6">
          <div className="rounded-2xl border border-line/40 bg-surface/70 p-6 backdrop-blur-xl">
            <div className="flex items-center gap-2 border-b border-rule-soft pb-3">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              <h2 className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-accent">
                ( Informasi Ibadah )
              </h2>
            </div>

            <dl className="mt-4 space-y-3">
              <DataPoint
                label="Penanggung Jawab (PIC)"
                value={pic?.nickname ?? pic?.fullName ?? "—"}
              />
              <DataPoint
                label="Pembicara"
                value={event.speakerName || "Pengurus Youth"}
              />
              <DataPoint
                label="Keterangan / Rangkuman"
                value={event.description || "Tidak ada catatan tambahan."}
              />
            </dl>
          </div>

          <div className="rounded-2xl border border-rule-soft bg-canvas-sunk/60 p-5">
            <p className="font-mono text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-accent">
              Catatan Penatalayan
            </p>
            <p className="mt-2 text-xs leading-relaxed text-ink-muted">
              Latihan awal diadakan Rabu pukul 19:00 WIB. Gladi bersih ibadah dilaksanakan Sabtu pukul 15:00 WIB di Ruang Hermon.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
