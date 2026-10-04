import type { Metadata } from "next";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getMySessionInfo } from "@/lib/data";
import { ROLE_LABEL } from "@/lib/roles";
import { PageHeader, DataPoint, SectionTitle, Panel } from "@/components/page-parts";
import { AccountApprovals } from "@/components/AccountApprovals";
import { SignOutButton } from "@/components/SignOutButton";

export const metadata: Metadata = { title: "Pengaturan Sistem" };

export default async function SettingsPage() {
  const live = isSupabaseConfigured();
  const session = await getMySessionInfo();

  return (
    <div className="px-5 py-7 sm:px-8 sm:py-9">
      <PageHeader
        kicker="INFRASTRUKTUR"
        title="Pengaturan & Status Sistem"
        description="Persetujuan akses akun, status koneksi basis data, dan konfigurasi autentikasi."
      />

      <div className="mt-8 space-y-6">
        {/* Admin-only: empty for everyone else, because RLS returns no rows. */}
        <AccountApprovals />
        {/* Who is signed in — role shown here so nobody has to guess. */}
        {session && (
          <Panel aria-labelledby="account-heading">
            <SectionTitle id="account-heading" title="Akun saya" />

            <dl className="mt-6 grid gap-x-8 gap-y-3 sm:grid-cols-2 border-t border-rule-soft pt-4">
              <DataPoint
                label="Masuk Sebagai"
                value={
                  session.displayName && session.email
                    ? `${session.displayName} (${session.email})`
                    : (session.displayName ?? session.email ?? "—")
                }
              />
              <DataPoint
                label="Peran"
                value={ROLE_LABEL[session.appRole] ?? session.appRole}
              />
            </dl>

            <div className="mt-6 max-w-xs">
              <SignOutButton label="Keluar" />
            </div>
          </Panel>
        )}
        {/* Connection Status Card */}
        <Panel aria-labelledby="status-heading">
          <SectionTitle id="status-heading" title="Status lingkungan & koneksi" />

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <span
              className={`tag font-medium ${
                live ? "tag-sage" : "tag-warning"
              }`}
            >
              {live ? "Terkoneksi ke Supabase" : "Mode demo terisolasi"}
            </span>
            <p className="text-xs sm:text-sm text-ink-muted">
              {live
                ? "Data beroperasi langsung dengan basis data cloud PostgreSQL Supabase."
                : "Aplikasi berjalan dengan mock dataset lokal untuk keperluan preview UI."}
            </p>
          </div>

          <dl className="mt-6 grid gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-3 border-t border-rule-soft pt-4">
            <DataPoint
              label="Mesin Basis Data"
              value={live ? "Supabase PostgreSQL" : "Local Seed Runtime"}
            />
            <DataPoint
              label="Protokol Autentikasi"
                value={live ? "Google OAuth 2.0" : "Tanpa Login (Mode Demo)"}
            />
            <DataPoint
              label="Zona Waktu Standar"
              value="Asia/Jakarta (WIB · UTC+7)"
            />
          </dl>
        </Panel>

        {/* Integration Instructions Card (if in demo mode) */}
        {!live && (
          <Panel tone="accent" aria-labelledby="next-steps-heading">
            <SectionTitle id="next-steps-heading" title="Panduan aktivasi Supabase live" />

            <ol className="mt-5 space-y-4">
              {[
                "Aktifkan Google sebagai provider login di dashboard Supabase (Authentication → Providers → Google).",
                "Salin nilai NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY ke dalam Environment Variables di Vercel atau .env.local.",
                "Deploy ulang aplikasi. Pengurus yang masuk via Google akan muncul di daftar 'Akses Akun' di atas sebagai menunggu persetujuan — mereka tidak melihat data apa pun sampai admin menyetujuinya.",
              ].map((step, i) => (
                <li key={step} className="flex items-start gap-3.5">
                  <span className="lp-num w-6 shrink-0 pt-0.5 text-lg text-ink-faint" aria-hidden="true">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p className="text-xs sm:text-sm leading-relaxed text-ink pt-0.5">
                    {step}
                  </p>
                </li>
              ))}
            </ol>

            <div className="mt-6 rounded-xl border border-rule-soft bg-canvas-sunk/60 p-4 text-xs leading-relaxed text-ink-muted">
              <strong className="text-ink">Catatan Keamanan:</strong> Pastikan hanya menggunakan <code className="font-mono text-ink">anon public key</code> pada frontend Next.js. Jangan pernah mengekspos <code className="font-mono text-danger">service_role secret</code> ke client bundle.
            </div>
          </Panel>
        )}
      </div>
    </div>
  );
}
