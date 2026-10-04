import Link from "next/link";
import { ShieldCheck, Clock, ShieldX } from "lucide-react";
import { Logomark } from "@/components/Masthead";
import { SignOutButton } from "@/components/SignOutButton";

/**
 * What an account sees before an admin has let it in.
 *
 * Deliberately says nothing about the congregation — not a count, not a name,
 * not a schedule. The whole point of the approval gate is that an unapproved
 * visitor learns nothing about who is in the system.
 *
 * A rejected account gets its own copy, not the waiting copy: telling someone
 * "menunggu" when an admin already said no is a lie that wastes everyone's
 * time. Both states get a sign-out button — this screen is the only UI a
 * pending/rejected account ever sees, so without it they can never leave.
 */
export function PendingApproval({
  status = "pending",
}: {
  status?: "pending" | "rejected";
}) {
  const rejected = status === "rejected";
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-6 py-16 text-ink">

      <main id="main" className="relative w-full max-w-md text-center">
        <div className="mx-auto mb-8 flex justify-center">
          <Logomark />
        </div>

        <div className="rounded-2xl border border-line bg-surface/80 p-7 shadow-sm sm:p-8">
          <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-line-accent/40 bg-accent-wash text-accent">
            {rejected ? (
              <ShieldX className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Clock className="h-5 w-5" aria-hidden="true" />
            )}
          </div>

          <h1 className="font-serif text-2xl font-bold text-ink">
            {rejected
              ? "Akses Tidak Disetujui"
              : "Menunggu Persetujuan Pengurus"}
          </h1>

          {rejected ? (
            <>
              <p className="mt-3 text-sm leading-relaxed text-ink-muted">
                Pengurus memutuskan akun ini belum diberi akses ke portal.
                Keputusan ini bisa berubah — kalau kamu merasa ini keliru,
                hubungi admin Komisi Pemuda dan minta ditinjau ulang.
              </p>
            </>
          ) : (
            <>
              <p className="mt-3 text-sm leading-relaxed text-ink-muted">
                Akunmu sudah terdaftar, tapi belum diberi akses. Portal ini berisi
                data jemaat Komisi Pemuda, jadi setiap akun disetujui satu per satu
                oleh pengurus.
              </p>

              <p className="mt-4 text-sm leading-relaxed text-ink-muted">
                Kalau kamu memang pengurus atau pemimpin Cross, hubungi admin
                Komisi Pemuda supaya akunmu diaktifkan.
              </p>
            </>
          )}

          <div className="mt-6 flex items-center justify-center gap-2 border-t border-rule-soft pt-5 text-xs text-ink-faint">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>Tidak ada data jemaat yang bisa diakses sebelum disetujui.</span>
          </div>

          <div className="mt-5">
            <SignOutButton />
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
