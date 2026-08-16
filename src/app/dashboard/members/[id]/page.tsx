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

const STATUS: Record<string, { label: string; cls: string }> = {
  active: { label: "Aktif", cls: "tag tag-sage" },
  away: { label: "Berhalangan", cls: "tag tag-warning" },
  alumni: { label: "Alumni", cls: "tag" },
  inactive: { label: "Tidak aktif", cls: "tag" },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const profile = await getProfileById(id);
  return { title: profile?.nickname ?? "Anggota" };
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

  // Contact gate, both halves:
  // - The number itself comes from get_member_whatsapp(), a SECURITY
  //   DEFINER RPC that re-checks the role in SQL; the whatsapp column is
  //   column-level revoked from clients (migration 0006).
  // - The button is additionally only rendered for roles that pass the
  //   gate, so a member's browser never even receives the number.
  // Demo mode (no auth): every visitor sees the seed's fake numbers
  // (prefix 6280000) so the feature is verifiable without a database.
  const canView = isSupabaseConfigured()
    ? canViewContacts(me?.appRole)
    : true;
  const whatsapp = canView ? await getMemberWhatsapp(id) : null;

  const status = STATUS[profile.status] ?? STATUS.inactive;

  return (
    <div className="px-5 py-7 sm:px-8 sm:py-9">
      <BackLink href="/dashboard/members">Kembali ke anggota</BackLink>

      <div className="mt-2">
        <PageHeader kicker="Anggota" title={profile.nickname} meta={profile.fullName} />
      </div>

      <div className="mt-7 flex items-center gap-4">
        <Monogram name={profile.nickname} size="lg" />
        <span className={status.cls}>{status.label}</span>
      </div>

      <dl className="mt-8 grid gap-x-8 gap-y-1 sm:grid-cols-2 lg:grid-cols-3">
        <DataPoint label="Universitas" value={profile.university || "—"} />
        <DataPoint label="Asal" value={profile.hometown || "—"} />
        <DataPoint label="Angkatan" value={profile.cohort || "—"} />
        <DataPoint
          label="Ulang tahun"
          value={profile.birthDate ? formatDayMonth(profile.birthDate) : "—"}
        />
        <DataPoint
          label="Pelayanan 30 hari"
          value={
            <span className="num">
              {profile.serviceCount30d}×
              {profile.serviceCount30d > 3 && (
                <span className="ml-2 text-sm text-warning">
                  perlu diistirahatkan
                </span>
              )}
            </span>
          }
        />
      </dl>

      {/* WhatsApp contact — only reachable through the role-gated RPC.
          "No number" and "no access" both render nothing here. */}
      {whatsapp ? (
        <div className="mt-8 border-t border-rule pt-5">
          <WhatsAppButton number={whatsapp} name={profile.nickname} />
        </div>
      ) : (
        <p className="mt-8 border-t border-rule pt-4 text-sm leading-relaxed text-ink-muted">
          Nomor kontak tidak tersedia untuk akun kamu. Hubungi pengurus inti
          kalau perlu menghubungi anggota ini secara langsung.
        </p>
      )}
    </div>
  );
}
