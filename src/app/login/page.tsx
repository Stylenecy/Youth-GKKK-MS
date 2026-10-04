import "@/components/landing/landing.css";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const metadata: Metadata = {
  title: "Masuk Portal Pengurus",
  robots: { index: false, follow: false },
};

/** Absolute origin of this app from the incoming request. */
async function appOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto =
    h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

async function signInWithGoogle() {
  "use server";
  if (!isSupabaseConfigured()) return;

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  const origin = await appOrigin();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${origin}/auth/callback` },
  });

  if (error || !data?.url) {
    redirect("/login?error=oauth");
  }
  redirect(data.url);
}

const d = (s: number) => ({ "--d": `${s}s` }) as CSSProperties;

function GoogleMark() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
    </svg>
  );
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const supabaseReady = isSupabaseConfigured();
  const { error } = await searchParams;

  return (
    <div className="lp flex min-h-screen flex-col" data-theme="dark">
      <header className="lp-wrap flex h-16 items-center justify-between gap-4">
        <Link href="/" className="lp-link lp-meta lp-in-fade text-ink-muted hover:text-ink" style={d(0.1)}>
          <span aria-hidden="true">&larr;</span> Beranda
        </Link>
        <p className="lp-meta lp-in-fade" style={d(0.18)}>
          <span className="lp-bracket">Portal pengurus</span>
        </p>
      </header>

      <main id="main" className="lp-wrap relative flex flex-1 flex-col justify-center pb-16 pt-6">
        <div className="lp-grid lp-in-fade" style={d(0)} aria-hidden="true" />
        <span className="lp-rule lp-in-draw relative" style={d(0.1)} />

        <div className="relative grid flex-1 items-center gap-12 py-12 lg:grid-cols-12 lg:gap-6 lg:py-16">
          <div className="lg:col-span-6">
            <div className="relative w-24 sm:w-28" aria-hidden="true">
              <div
                className="lp-hero-bloom"
                style={{ width: "260%", aspectRatio: "1", left: "50%", top: "50%", transform: "translate(-50%, -50%)" }}
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/crest-192.webp"
                width={192}
                height={257}
                alt=""
                className="lp-in-settle relative h-auto w-full"
                style={d(0.2)}
              />
            </div>
            <p className="lp-meta lp-in-fade mt-10" style={d(0.35)}>
              <span className="text-accent">YGMS</span>&nbsp;&nbsp;Komisi Pemuda GKKK Jogja
            </p>
            <h1 className="lp-display mt-4 text-ink">
              <span className="lp-line">
                <span className="lp-in-rise" style={d(0.4)}>
                  Ruang kerja
                </span>
              </span>
              <span className="lp-line">
                <span className="lp-in-rise" style={d(0.5)}>
                  <em className="lp-italic text-accent">pengurus</em>.
                </span>
              </span>
            </h1>
            <p className="lp-lead lp-in-fade mt-6 max-w-md" style={d(0.7)}>
              {supabaseReady
                ? "Jadwal penatalayan, absensi, kas, dan data anggota Pemuda. Masuk dengan akun Google yang sudah terdaftar."
                : "Aplikasi berjalan dalam mode demo dengan data contoh, tanpa basis data."}
            </p>
          </div>

          <div className="lg:col-span-5 lg:col-start-8">
            <div className="lp-hud lp-in-unclip bg-surface px-6 py-8 sm:px-8 sm:py-10" style={d(0.55)}>
              <p className="lp-meta">
                <span className="text-accent">01</span>&nbsp;&nbsp;<span className="lp-bracket">Masuk</span>
              </p>

              {(error === "oauth" || error === "auth") && (
                <div role="alert" className="mt-6 rounded-md border border-danger/50 bg-danger-wash p-4 text-sm leading-relaxed text-danger">
                  {error === "oauth"
                    ? "Google belum bisa memproses permintaan masuk. Coba lagi beberapa saat lagi."
                    : "Sesi Google gagal disambungkan (mungkin tautannya kedaluwarsa atau dibatalkan). Tekan tombol Google sekali lagi."}
                </div>
              )}

              {supabaseReady ? (
                <form action={signInWithGoogle} className="mt-6">
                  <button type="submit" className="lp-btn lp-btn-primary w-full">
                    <GoogleMark />
                    Lanjutkan dengan Google
                  </button>
                </form>
              ) : (
                <Link href="/dashboard" className="lp-btn lp-btn-primary mt-6 w-full">
                  Buka dashboard (mode demo)
                  <span aria-hidden="true" className="lp-arrow">
                    &rarr;
                  </span>
                </Link>
              )}

              <span className="lp-rule mt-8" />
              <dl className="mt-6 grid gap-5 text-sm leading-relaxed">
                <div>
                  <dt className="lp-meta">Siapa yang bisa masuk</dt>
                  <dd className="mt-1.5 text-ink-muted">
                    Pengurus, penatalayan, dan pemimpin kelompok Cross yang terdaftar.
                  </dd>
                </div>
                <div>
                  <dt className="lp-meta">Akun baru</dt>
                  <dd className="mt-1.5 text-ink-muted">
                    Setelah masuk pertama kali, akunmu menunggu persetujuan admin Pemuda.
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        <span className="lp-rule lp-in-draw relative" style={d(0.6)} />
        <div className="relative mt-4 flex flex-wrap justify-between gap-3">
          <p className="lp-meta lp-in-fade" style={d(0.8)}>
            © {new Date().getFullYear()} Komisi Pemuda GKKK Jogja
          </p>
          <p className="lp-meta lp-in-fade" style={d(0.86)}>
            Ibadah Pemuda · Sabtu 17.00 WIB
          </p>
        </div>
      </main>
    </div>
  );
}
