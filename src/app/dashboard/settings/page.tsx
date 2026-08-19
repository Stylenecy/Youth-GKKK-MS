import type { Metadata } from "next";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { PageHeader, DataPoint } from "@/components/page-parts";
import { AccountApprovals } from "@/components/AccountApprovals";
import { Settings, Shield, Database, Lock, Globe, CheckCircle2 } from "lucide-react";

export const metadata: Metadata = { title: "Pengaturan Sistem" };

export default function SettingsPage() {
  const live = isSupabaseConfigured();

  return (
    <div className="px-5 py-7 sm:px-8 sm:py-9">
      <PageHeader
        kicker="INFRASTRUKTUR"
        title="Pengaturan & Status Sistem"
        meta="Persetujuan akses akun, status koneksi basis data, dan konfigurasi autentikasi."
      />

      <div className="mt-8 space-y-6">
        {/* Admin-only: empty for everyone else, because RLS returns no rows. */}
        <AccountApprovals />
        {/* Connection Status Card */}
        <section
          className="rounded-2xl border border-line/40 bg-surface/75 p-6 backdrop-blur-xl shadow-sm sm:p-7"
          aria-labelledby="status-heading"
        >
          <div className="flex items-center justify-between border-b border-rule-soft pb-3">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              <h2
                id="status-heading"
                className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-accent"
              >
                ( STATUS LINGKUNGAN & KONEKSI )
              </h2>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <span
              className={`tag font-medium ${
                live ? "tag-sage" : "tag-warning"
              }`}
            >
              {live ? "● Terkoneksi ke Supabase" : "● Mode Demo Terisolasi"}
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
              value={live ? "Google OAuth 2.0" : "Bypass (Demo Mode)"}
            />
            <DataPoint
              label="Zona Waktu Standar"
              value="Asia/Jakarta (WIB · UTC+7)"
            />
          </dl>
        </section>

        {/* Integration Instructions Card (if in demo mode) */}
        {!live && (
          <section
            className="rounded-2xl border border-line-accent/40 bg-gradient-to-b from-surface/90 to-accent-wash/30 p-6 backdrop-blur-xl shadow-sm sm:p-7"
            aria-labelledby="next-steps-heading"
          >
            <div className="flex items-center gap-2 border-b border-rule-soft pb-3">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              <h2
                id="next-steps-heading"
                className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-accent"
              >
                ( PANDUAN AKTIVASI SUPABASE LIVE )
              </h2>
            </div>

            <ol className="mt-5 space-y-4">
              {[
                "Aktifkan Google sebagai provider login di dashboard Supabase (Authentication → Providers → Google).",
                "Salin nilai NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY ke dalam Environment Variables di Vercel atau .env.local.",
                "Deploy ulang aplikasi. Pengurus yang masuk via Google akan muncul di daftar 'Akses Akun' di atas sebagai menunggu persetujuan — mereka tidak melihat data apa pun sampai admin menyetujuinya.",
              ].map((step, i) => (
                <li key={step} className="flex items-start gap-3.5">
                  <span className="num mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-line-accent/50 bg-accent-wash font-mono text-xs font-bold text-accent">
                    {i + 1}
                  </span>
                  <p className="text-xs sm:text-sm leading-relaxed text-ink pt-0.5">
                    {step}
                  </p>
                </li>
              ))}
            </ol>

            <div className="mt-6 rounded-xl border border-rule-soft bg-canvas-sunk/60 p-4 text-xs leading-relaxed text-ink-muted">
              <strong className="text-ink">Catatan Keamanan:</strong> Pastikan hanya menggunakan <code className="font-mono text-accent">anon public key</code> pada frontend Next.js. Jangan pernah mengekspos <code className="font-mono text-danger">service_role secret</code> ke client bundle.
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
