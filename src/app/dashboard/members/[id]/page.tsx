import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getProfileById,
  getMemberWhatsapp,
  getCurrentProfile,
  isSupabaseConfigured,
} from "@/lib/data";
import { canViewContacts } from "@/lib/phone";
import { PageHeader, BackLink, DataPoint, Monogram } from "@/components/page-parts";
import WhatsAppButton from "@/components/WhatsAppButton";
import { formatDayMonth } from "@/lib/datetime";
import { User, AlertTriangle, ShieldCheck } from "lucide-react";

const STATUS: Record<string, { label: string; cls: string }> = {
  active: { label: "Aktif Melayani", cls: "tag tag-sage font-medium" },
  away: { label: "Berhalangan Sementara", cls: "tag tag-warning font-medium" },
  alumni: { label: "Alumni Youth", cls: "tag font-medium opacity-75" },
  inactive: { label: "Tidak Aktif", cls: "tag font-medium opacity-60" },
};

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
  const [profile, me] = await Promise.all([
    getProfileById(id),
    getCurrentProfile(),
  ]);
  if (!profile) notFound();

  const canView = isSupabaseConfigured()
    ? canViewContacts(me?.appRole)
    : true;
  const whatsapp = canView ? await getMemberWhatsapp(id) : null;

  const status = STATUS[profile.status] ?? STATUS.inactive;
  const isFatigued = profile.serviceCount30d > 3;

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
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line/40 bg-surface/75 p-6 backdrop-blur-xl shadow-sm">
        <div className="flex items-center gap-4">
          <Monogram name={profile.nickname} size="lg" />
          <div>
            <h2 className="font-serif text-2xl font-bold text-ink">
              {profile.fullName}
            </h2>
            <p className="font-mono text-xs text-accent">
              Nama Panggilan: {profile.nickname}
            </p>
          </div>
        </div>

        <span className={status.cls}>{status.label}</span>
      </div>

      {/* Fatigue Warning Banner */}
      {isFatigued && (
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-warning/40 bg-warning-wash/70 p-4.5 text-sm text-warning backdrop-blur-xl">
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <p className="font-bold">Perlu Diistirahatkan ({profile.serviceCount30d}&times; Pelayanan)</p>
            <p className="mt-1 text-xs text-ink-muted leading-relaxed">
              Anggota ini telah melayani lebih dari 3 kali dalam 30 hari terakhir. Berikan waktu jeda pelayanan agar keseimbangan rohani dan fisiknya tetap terjaga.
            </p>
          </div>
        </div>
      )}

      {/* Data Points Grid */}
      <div className="mt-6 rounded-2xl border border-line/40 bg-surface/75 p-6 backdrop-blur-xl shadow-sm">
        <div className="flex items-center gap-2 border-b border-rule-soft pb-3">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          <h3 className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-accent">
            ( Informasi Pribadi & Pelayanan )
          </h3>
        </div>

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
              <span className="num font-mono font-bold text-accent">
                {profile.serviceCount30d}&times; Sesi
              </span>
            }
          />
        </dl>
      </div>

      {/* WhatsApp Contact Action */}
      <div className="mt-6 rounded-2xl border border-rule-soft bg-canvas-sunk/70 p-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="h-1.5 w-1.5 rounded-full bg-sage" />
          <h3 className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-sage">
            ( Saluran Komunikasi )
          </h3>
        </div>

        {whatsapp ? (
          <div>
            <p className="text-xs text-ink-muted mb-4 leading-relaxed">
              Nomor WhatsApp terverifikasi melalui otorisasi keamanan pengurus. Tekan tombol di bawah untuk langsung membuka obrolan.
            </p>
            <WhatsAppButton number={whatsapp} name={profile.nickname} />
          </div>
        ) : (
          <p className="text-xs leading-relaxed text-ink-muted">
            Nomor kontak privat dilindungi oleh sistem keamanan berbasis peran (Role-based access). Hubungi pengurus inti jika membutuhkan nomor WhatsApp anggota ini.
          </p>
        )}
      </div>
    </div>
  );
}
