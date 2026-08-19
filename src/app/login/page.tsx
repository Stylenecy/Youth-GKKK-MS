import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { Logomark } from "@/components/Masthead";
import { ArrowLeft, ShieldCheck, Sparkles, KeyRound } from "lucide-react";

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

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const supabaseReady = isSupabaseConfigured();
  const { error } = await searchParams;

  return (
    <div className="relative min-h-screen bg-canvas text-ink flex flex-col justify-between selection:bg-accent selection:text-canvas overflow-hidden">
      {/* Ambient warm bloom lighting */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[radial-gradient(ellipse_at_top,rgba(253,190,2,0.18),rgba(131,2,28,0.12),transparent_70%)] blur-3xl opacity-80"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 right-1/4 w-[600px] h-[400px] bg-[radial-gradient(ellipse_at_bottom,rgba(131,2,28,0.2),transparent_70%)] blur-3xl opacity-60"
      />

      {/* Top Header */}
      <header className="relative z-10 p-6 flex justify-between items-center max-w-5xl mx-auto w-full">
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-mono text-xs text-ink-muted hover:text-accent transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali ke Halaman Utama</span>
        </Link>

        <span className="font-mono text-[0.6875rem] uppercase tracking-[0.2em] text-accent">
          ( PORTAL PENGURUS )
        </span>
      </header>

      {/* Main Login Card */}
      <main id="main" className="relative z-10 flex flex-1 items-center justify-center px-5 py-8">
        <div className="w-full max-w-md">
          {/* Brand Crest */}
          <div className="text-center">
            <div className="relative inline-flex items-center justify-center">
              <div
                aria-hidden="true"
                className="absolute inset-0 rounded-2xl bg-accent/20 blur-xl"
              />
              <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-line-accent/60 bg-surface shadow-2xl">
                <Logomark />
              </div>
            </div>

            <p className="mt-5 font-mono text-xs font-bold uppercase tracking-[0.24em] text-accent">
              Youth GKKK Mangga Sarana
            </p>
            <h1 className="mt-2 font-serif text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              Portal Tata Kelola
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-ink-muted max-w-xs mx-auto leading-relaxed">
              {supabaseReady
                ? "Masuk dengan akun Google resmi untuk mengakses jadwal, Cross, dan pembukuan kas."
                : "Aplikasi berjalan dalam mode demonstrasi pengurus."}
            </p>
          </div>

          {/* Form / Button Container */}
          <div className="relative mt-8 overflow-hidden rounded-3xl border border-line/50 bg-surface/85 p-7 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
            {/* Top Accent Rim */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent to-transparent opacity-70"
            />

            {error === "oauth" && (
              <div
                role="alert"
                className="mb-5 rounded-xl border border-danger/40 bg-danger-wash p-3.5 text-xs text-danger"
              >
                Gagal memproses autentikasi Google. Silakan coba kembali beberapa saat lagi.
              </div>
            )}

            {supabaseReady ? (
              <form action={signInWithGoogle} className="space-y-4">
                <button
                  type="submit"
                  className="btn-primary w-full justify-center text-sm font-semibold shadow-[0_0_24px_rgba(253,190,2,0.3)] py-3"
                >
                  <svg className="h-4 w-4 mr-1" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  Lanjutkan dengan Google
                </button>
              </form>
            ) : (
              <div className="space-y-4">
                <Link
                  href="/dashboard"
                  className="btn-primary w-full justify-center text-sm font-semibold shadow-[0_0_24px_rgba(253,190,2,0.3)] py-3 text-center"
                >
                  <Sparkles className="h-4 w-4" />
                  Masuk ke Dashboard (Mode Demo)
                </Link>
              </div>
            )}

            <div className="mt-5 rounded-2xl border border-rule-soft bg-canvas-sunk/60 p-4 text-center">
              <p className="text-xs leading-relaxed text-ink-muted">
                {supabaseReady ? (
                  "Hak akses diberikan khusus kepada penatalayan, pembina, dan pemimpin kelompok Cross terdaftar."
                ) : (
                  "Sistem saat ini menggunakan local seed dataset. Anda dapat meninjau seluruh fitur kepengurusan secara instan."
                )}
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 p-6 text-center text-xs font-mono text-ink-faint">
        &copy; {new Date().getFullYear()} Komisi Pemuda GKKK Mangga Sarana.
      </footer>
    </div>
  );
}
