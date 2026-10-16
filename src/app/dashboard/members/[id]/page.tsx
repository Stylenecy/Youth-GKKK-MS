import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getProfileById,
  getMemberWhatsapp,
  getMyRole,
  isSupabaseConfigured,
} from "@/lib/data";
import { canViewContacts } from "@/lib/phone";
import { isOverloaded, FATIGUE_THRESHOLD, FATIGUE_WINDOW_DAYS } from "@/lib/fatigue";
import { MEMBER_STATUS_TAG } from "@/lib/members";
import {
  PageHeader,
  BackLink,
  DataPoint,
  Monogram,
  Panel,
  SectionTitle,
} from "@/components/page-parts";
import WhatsAppButton from "@/components/WhatsAppButton";
import { formatDayMonth } from "@/lib/datetime";
import { AlertTriangle } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const profile = await getProfileById(id);
  return { title: profile?.nickname ? `${profile.nickname} · Anggota` : "Detail Anggota" };
}

export default async function MemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // The role comes from get_my_app_role() (via getMyRole), not from the
  // caller's profile row: an admin login without a roster profile has no
  // profile, and used to fall back to "member" and lose the contact button.
  const [profile, role] = await Promise.all([
    getProfileById(id),
    getMyRole(),
  ]);
  if (!profile) notFound();

  const canView = isSupabaseConfigured() ? canViewContacts(role) : true;
  // undefined = the read failed (shown as an error, never as "protected");
  // null = allowed, but no number on record.
  const whatsapp = canView
    ? await getMemberWhatsapp(id).catch(() => undefined)
    : null;

  const status = MEMBER_STATUS_TAG[profile.status] ?? MEMBER_STATUS_TAG.inactive;
  const isFatigued = isOverloaded(profile.serviceCount30d);

  return (
    <div className="px-5 py-7 sm:px-8 sm:py-9">
      <BackLink href="/dashboard/members">Kembali ke direktori anggota</BackLink>

      <div className="mt-3">
        <PageHeader
          kicker="PROFIL JEMAAT"
          title={profile.nickname}
          meta={profile.fullName}
        />
      </div>

      {/* Identity Card */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-line/60 bg-surface p-5 sm:p-6">
        <div className="flex items-center gap-4">
          <Monogram name={profile.nickname} size="lg" />
          <div>
            <h2 className="font-serif text-2xl font-normal text-ink">
              {profile.fullName}
            </h2>
            <p className="lp-meta mt-1">Panggilan · {profile.nickname}</p>
          </div>
        </div>

        <span className={status.cls}>{status.label}</span>
      </div>

      {/* Fatigue Warning Banner */}
      {isFatigued && (
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-warning/40 bg-warning-wash/70 p-4.5 text-sm text-warning">
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <p className="font-bold">Perlu Diistirahatkan ({profile.serviceCount30d}&times; Pelayanan)</p>
            <p className="mt-1 text-xs text-ink-muted leading-relaxed">
              Anggota ini telah melayani lebih dari {FATIGUE_THRESHOLD} kali dalam {FATIGUE_WINDOW_DAYS} hari terakhir. Berikan waktu jeda pelayanan agar keseimbangan rohani dan fisiknya tetap terjaga.
            </p>
          </div>
        </div>
      )}

      {/* Data Points Grid */}
      <Panel className="mt-6" aria-labelledby="info-heading">
        <SectionTitle id="info-heading" title="Informasi pribadi & pelayanan" />

        <dl className="mt-4 grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
          <DataPoint label="Kampus / Universitas" value={profile.university || "—"} />
          <DataPoint label="Kota Asal" value={profile.hometown || "—"} />
          <DataPoint label="Tahun Angkatan" value={profile.cohort || "—"} />
          <DataPoint
            label="Tanggal Ulang Tahun"
            value={profile.birthDate ? formatDayMonth(profile.birthDate) : "—"}
          />
          <DataPoint
            label="Intensitas Pelayanan (30 Hari)"
            value={
              <span className="num font-mono">
                {profile.serviceCount30d}&times; sesi
              </span>
            }
          />
        </dl>
      </Panel>

      {/* WhatsApp Contact Action */}
      <Panel tone="sunk" className="mt-6" aria-labelledby="contact-heading">
        <div className="mb-3">
          <SectionTitle id="contact-heading" title="Saluran komunikasi" />
        </div>

        {!canView ? (
          <p className="text-xs leading-relaxed text-ink-muted">
            Nomor ini hanya bisa dilihat pengurus inti. Hubungi mereka kalau perlu.
          </p>
        ) : whatsapp === undefined ? (
          <p
            role="alert"
            className="rounded-xl border border-danger/40 bg-danger-wash px-3.5 py-2.5 text-xs text-danger"
          >
            Nomor WhatsApp gagal dimuat. Muat ulang halaman sebentar lagi.
          </p>
        ) : whatsapp ? (
          <div>
            <p className="text-xs text-ink-muted mb-4 leading-relaxed">
              Tekan tombol di bawah untuk membuka obrolan WhatsApp.
            </p>
            <WhatsAppButton number={whatsapp} name={profile.nickname} />
          </div>
        ) : (
          <p className="text-xs leading-relaxed text-ink-muted">
            Belum ada nomor WhatsApp tercatat untuk anggota ini. Minta admin menambahkannya.
          </p>
        )}
      </Panel>
    </div>
  );
}
