import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { Logomark } from "@/components/Masthead";

export const metadata: Metadata = {
  title: "Masuk",
  robots: { index: false, follow: false },
};

/** Absolute origin of *this* app, from the incoming request. */
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

  // Previously this used the Supabase project URL as the origin, which sent
  // users to <project>.supabase.co/auth/callback instead of back to the app.
  const origin = await appOrigin();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${origin}/auth/callback` },
  });

  // signInWithOAuth only *returns* the provider URL on the server; without
  // this redirect the button did nothing at all.
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
    <div className="paper flex min-h-screen flex-col">
      <main
        id="main"
        className="flex flex-1 items-center justify-center px-5 py-12"
      >
        <div className="w-full max-w-sm">
          <div className="text-center">
            <Link
              href="/"
              className="inline-flex min-h-[44px] items-center gap-2.5 text-ink"
            >
              <Logomark />
              <span className="font-serif text-lg font-semibold">
                Space Youth
              </span>
            </Link>

            <h1 className="t-subtitle mt-6 text-ink">Masuk ke dashboard</h1>
            <p className="mt-2 text-sm text-ink-muted">
              {supabaseReady
                ? "Gunakan akun Google yang terdaftar di komisi."
                : "Sedang berjalan dalam mode demo."}
            </p>
          </div>

          <div className="card mt-8 p-6">
            {error === "oauth" && (
              <p
                role="alert"
                className="mb-4 rounded-md bg-danger-wash px-3 py-2.5 text-sm text-danger"
              >
                Gagal menghubungi Google. Coba lagi sebentar lagi.
              </p>
            )}

            {supabaseReady ? (
              <form action={signInWithGoogle}>
                <button type="submit" className="btn-primary w-full">
                  Lanjutkan dengan Google
                </button>
              </form>
            ) : (
              <Link href="/dashboard" className="btn-primary w-full">
                Masuk (mode demo)
              </Link>
            )}

            <p className="mt-4 text-center text-xs leading-relaxed text-ink-faint">
              {supabaseReady ? (
                <>
                  Login terbuka untuk pengurus dan anggota aktif. Akun baru
                  menunggu persetujuan admin.
                </>
              ) : (
                <>
                  Supabase belum terhubung, jadi data yang tampil adalah contoh.
                  Isi <code className="font-mono">.env.local</code> untuk memakai
                  data sungguhan.
                </>
              )}
            </p>

            <div className="mt-5 border-t border-rule-soft pt-4 text-center">
              <Link
                href="/"
                className="font-mono text-xs text-ink-faint transition-colors hover:text-ink-muted"
              >
                <span aria-hidden="true">&larr;</span> Kembali ke halaman depan
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
