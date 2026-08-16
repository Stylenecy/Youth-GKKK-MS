import type { Metadata } from "next";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { PageHeader, DataPoint } from "@/components/page-parts";

export const metadata: Metadata = { title: "Pengaturan" };

export default function SettingsPage() {
  const live = isSupabaseConfigured();

  return (
    <div className="px-5 py-7 sm:px-8 sm:py-9">
      <PageHeader
        kicker="Sistem"
        title="Pengaturan"
        meta="Status sambungan dan langkah yang masih perlu dikerjakan."
      />

      <section className="card mt-8 p-5 sm:p-6" aria-labelledby="status-heading">
        <h2
          id="status-heading"
          className="font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-ink-faint"
        >
          Status
        </h2>

        <div className="mt-4 flex items-center gap-2.5">
          <span className={live ? "tag tag-sage" : "tag tag-warning"}>
            {live ? "Tersambung" : "Mode demo"}
          </span>
          <p className="text-sm text-ink-muted">
            {live
              ? "Data diambil langsung dari Supabase."
              : "Semua data yang tampil adalah contoh."}
          </p>
        </div>

        <dl className="mt-6 space-y-3">
          <DataPoint label="Basis data" value={live ? "Supabase" : "Seed lokal"} />
          <DataPoint
            label="Autentikasi"
            value={live ? "Google OAuth" : "Dilewati (mode demo)"}
          />
          <DataPoint label="Zona waktu" value="Asia/Jakarta (WIB)" />
        </dl>
      </section>

      {!live && (
        <section
          className="card mt-5 p-5 sm:p-6"
          aria-labelledby="next-steps-heading"
        >
          <h2
            id="next-steps-heading"
            className="font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-ink-faint"
          >
            Untuk menyambungkan data sungguhan
          </h2>
          <ol className="mt-4 space-y-3">
            {[
              "Aktifkan Google sebagai provider login di Supabase → Authentication → Providers.",
              "Isi NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY di Vercel, lalu deploy ulang.",
              "Selesai — anggota tidak perlu di-seed manual. Setiap orang yang masuk lewat Google otomatis dapat profil, dan pemimpin Cross menambah anggotanya sendiri lewat Kelompokku.",
            ].map((step, i) => (
              <li key={step} className="flex gap-3">
                <span className="num mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-wash font-mono text-[0.625rem] font-semibold text-accent">
                  {i + 1}
                </span>
                <span className="text-[0.9375rem] leading-relaxed text-ink-muted">
                  {step}
                </span>
              </li>
            ))}
          </ol>
          <p className="mt-5 border-t border-rule-soft pt-4 text-sm leading-relaxed text-ink-muted">
            Gunakan <span className="font-mono text-ink">anon key</span>, bukan{" "}
            <span className="font-mono text-ink">service_role</span>. Service role
            memberi akses penuh ke seluruh basis data dan tidak boleh dipasang di
            aplikasi yang berjalan di browser.
          </p>
        </section>
      )}
    </div>
  );
}
