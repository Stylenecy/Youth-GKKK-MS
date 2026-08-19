import Link from "next/link";
import { ShieldCheck, Clock } from "lucide-react";
import { Logomark } from "@/components/Masthead";

/**
 * What an account sees before an admin has let it in.
 *
 * Deliberately says nothing about the congregation — not a count, not a name,
 * not a schedule. The whole point of the approval gate is that an unapproved
 * visitor learns nothing about who is in the system.
 */
export function PendingApproval() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-6 py-16 text-ink">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-96 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(253,190,2,0.06),rgba(131,2,28,0.03)_50%,transparent_80%)]"
      />

      <main id="main" className="relative w-full max-w-md text-center">
        <div className="mx-auto mb-8 flex justify-center">
          <Logomark />
        </div>

        <div className="rounded-2xl border border-line bg-surface/80 p-7 backdrop-blur-xl shadow-sm sm:p-8">
          <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-line-accent/40 bg-accent-wash text-accent">
            <Clock className="h-5 w-5" aria-hidden="true" />
          </div>

          <h1 className="font-serif text-2xl font-bold text-ink">
            Menunggu Persetujuan Pengurus
          </h1>

          <p className="mt-3 text-sm leading-relaxed text-ink-muted">
            Akunmu sudah terdaftar, tapi belum diberi akses. Portal ini berisi
            data jemaat Komisi Pemuda, jadi setiap akun disetujui satu per satu
            oleh pengurus.
          </p>

          <p className="mt-4 text-sm leading-relaxed text-ink-muted">
            Kalau kamu memang pengurus atau pemimpin Cross, hubungi admin
            Komisi Pemuda supaya akunmu diaktifkan.
          </p>

          <div className="mt-6 flex items-center justify-center gap-2 border-t border-rule-soft pt-5 text-xs text-ink-faint">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>Tidak ada data jemaat yang bisa diakses sebelum disetujui.</span>
          </div>
        </div>

        <Link
          href="/"
          className="mt-6 inline-block text-sm font-medium text-ink-muted underline underline-offset-4 transition-colors hover:text-accent"
        >
          Kembali ke halaman depan
        </Link>
      </main>
    </div>
  );
}
