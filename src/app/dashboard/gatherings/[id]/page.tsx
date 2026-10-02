import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getEventById,
  getProfiles,
  getStewardsByEvent,
  getAttendanceByEvent,
  getCurrentProfile,
  getMyLeaderCrossIds,
  getCrossMembers,
  getPicEligibleProfiles,
  getMySessionInfo,
  getProfileCrossNames,
} from "@/lib/data";
import { canRecordAttendance } from "@/lib/attendance";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { isCommittee as committeeRole } from "@/lib/roles";
import {
  PageHeader,
  BackLink,
  EmptyState,
  SectionTitle,
  SummaryRows,
  StatusChip,
  Meter,
} from "@/components/page-parts";
import { RoleRoster } from "@/components/RoleRoster";
import { serviceReadiness } from "@/lib/stewards";
import { EditEventForm } from "@/components/EditEventForm";
import { ConfirmAction } from "@/components/ConfirmAction";
import { AttendanceTaker } from "@/components/AttendanceTaker";
import { archiveEvent, restoreEvent } from "@/app/actions/gatherings";
import { eventStateLabel } from "@/lib/events";
import {
  formatFullDate,
  formatTime,
  countdownLabel,
  eventTypeLabel,
} from "@/lib/datetime";
import { Users, ClipboardCheck } from "lucide-react";


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

  const [profiles, stewards, attendance, current, leaderCrossIds, picEligible, session, crossNames] =
    await Promise.all([
      getProfiles(),
      getStewardsByEvent(id),
      getAttendanceByEvent(id),
      getCurrentProfile(),
      getMyLeaderCrossIds(),
      getPicEligibleProfiles(),
      getMySessionInfo(),
      getProfileCrossNames(),
    ]);

  const pic = profiles.find((p) => p.id === event.picId);
  // The PIC dropdown only offers pengurus — but an event saved before the
  // rule keeps its recorded PIC selectable, so editing never wipes history.
  const picOptions =
    pic && !picEligible.some((p) => p.id === pic.id)
      ? [pic, ...picEligible]
      : picEligible;
  const status = eventStateLabel(event);
  const ready = serviceReadiness(stewards);

  // Attendance visibility mirrors migration 0012's SQL policy at the UI
  // layer: committee + PIC see everyone, a leader sees only their own
  // members, and ordinary members see nothing at all — not even a card
  // saying the feature exists. The database re-checks every write, so
  // this only decides what is rendered, never what is allowed.
  // Write buttons mirror the events RLS (migration 0010, committee-only):
  // hidden for everyone else instead of failing on submit. The role comes
  // from the session (works even for admins without a profiles row);
  // demo mode keeps everything visible for preview.
  // One role for both gates: the session's. Reading it from the profiles
  // row instead hid attendance from admins who have no profile row.
  const role = isSupabaseConfigured()
    ? (session?.appRole ?? current?.appRole ?? "member")
    : null;
  const canManage = committeeRole(role);
  const isCommittee = role !== null && committeeRole(role);
  const isPic = !!current && !!event.picId && current.id === event.picId;
  const showAttendance = isSupabaseConfigured()
    ? canRecordAttendance({
        appRole: role,
        isEventPic: isPic,
        leadsAnyCross: leaderCrossIds.length > 0,
      })
    : true;

  // A leader's tick-box covers exactly the people 0012 lets them record:
  // active members of the crosses they lead. Committee and the PIC get
  // the whole roster.
  let recordable = profiles;
  if (isSupabaseConfigured() && showAttendance && !isCommittee && !isPic) {
    const perCross = await Promise.all(leaderCrossIds.map(getCrossMembers));
    const seen = new Map(perCross.flat().map((p) => [p.id, p]));
    recordable = [...seen.values()];
  }
  const presentIds = attendance.filter((a) => a.present).map((a) => a.profileId);

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
          meta={`${formatFullDate(event.date)} · ${formatTime(event.date)} · Ruang Hermon`}
        />
      </div>

      {/* Status & Countdown Badges */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <span className={status.cls}>{status.label}</span>
        <StatusChip tone="accent">{countdownLabel(event.date)}</StatusChip>
      </div>

      {/* Action Shelf — committee only (see canManage above) */}
      {canManage && (
        <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-rule-soft pt-6">
        <EditEventForm event={event} profiles={picOptions} />
          {event.status === "archived" ? (
            <ConfirmAction
              label="Pulihkan Ibadah"
              variant="outline"
              title="Pulihkan ibadah ini?"
              body="Ibadah akan kembali muncul sebagai rencana dan bisa dijadwalkan ulang."
              confirmLabel="Pulihkan"
              successMessage="Ibadah dipulihkan."
              onConfirm={restoreThis}
            />
          ) : (
            <ConfirmAction
              label="Arsipkan Ibadah"
              title="Arsipkan ibadah ini?"
              body="Ibadah akan hilang dari halaman depan dan agenda publik, tapi datanya tetap tersimpan untuk audit dan bisa dipulihkan kapan saja."
              confirmLabel="Arsipkan"
              successMessage="Ibadah diarsipkan. Bisa dipulihkan dari halaman ini kapan saja."
              onConfirm={archiveThis}
            />
          )}
        </div>
      )}

      {/* Roster (same Peran · Petugas · Slot table as the phone board) + facts */}
      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:items-start">
        <section aria-labelledby="stewards-heading" className="min-w-0">
          <SectionTitle
            id="stewards-heading"
            title="Penatalayan"
            meta={`${ready.filled}/${ready.needed} slot`}
          />
          <div className="mt-3">
            <Meter value={ready.filled} max={ready.needed} label="Slot penatalayan terisi" />
          </div>
          <p className={`mt-2 text-sm ${ready.missing.length ? "text-ink" : "text-sage"}`}>
            {ready.missing.length
              ? `Masih kurang: ${ready.missing.map((m) => `${m.role} ${m.count}`).join(" · ")}`
              : "Semua peran sudah terisi."}
          </p>
          <div className="mt-4">
            <RoleRoster
              eventId={id}
              eventLabel={formatFullDate(event.date)}
              stewards={stewards}
              profiles={profiles}
              crossNames={crossNames}
              canManage={canManage}
              showStatus
            />
          </div>
        </section>

        <aside aria-labelledby="info-heading" className="min-w-0">
          <SectionTitle id="info-heading" title="Informasi" />
          <div className="mt-3">
            <SummaryRows
              mono={false}
              label="Informasi ibadah"
              rows={[
                { label: "PIC", value: pic?.nickname ?? pic?.fullName ?? "—" },
                { label: "Pembicara", value: event.speakerName || "Pengurus Youth" },
                { label: "Mulai", value: formatTime(event.date) },
              ]}
            />
          </div>
          <p className="mt-3 text-sm leading-relaxed text-ink-muted">
            {event.description || "Tidak ada catatan tambahan."}
          </p>
        </aside>
      </div>

      {/* Attendance: only rendered for recorders, never for ordinary members */}
      {showAttendance && (
        <section aria-labelledby="attendance-heading" className="mt-10">
          <SectionTitle id="attendance-heading" title="Kehadiran" />

          <div className="mt-4">
            {!isSupabaseConfigured() ? (
              <EmptyState
                title="Absensi butuh Supabase"
                body="Sambungkan Supabase lalu jalankan migrasi 0012_attendance.sql (CHECKLIST_Dex.md Langkah 1) — kartu centang kehadiran akan muncul di sini."
                icon={ClipboardCheck}
              />
            ) : recordable.length === 0 ? (
              <EmptyState
                title="Belum ada anggota dalam jangkauanmu"
                body="Kamu tercatat sebagai pemimpin Cross tapi belum ada anggota aktif di kelompokmu. Minta admin menautkan akunmu, atau tambah anggota lewat halaman Kelompokku."
                icon={Users}
              />
            ) : (
              <AttendanceTaker
                eventId={id}
                members={recordable.map((p) => ({
                  id: p.id,
                  nickname: p.nickname,
                  fullName: p.fullName,
                }))}
                initialPresent={presentIds}
              />
            )}
          </div>
        </section>
      )}
    </div>
  );
}
