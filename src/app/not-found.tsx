import Link from "next/link";
import { Logomark } from "@/components/Masthead";

export default function NotFound() {
  return (
    <div className="paper flex min-h-screen flex-col">
      <main
        id="main"
        className="flex flex-1 items-center justify-center px-5 py-12"
      >
        <div className="max-w-md text-center">
          <Link
            href="/"
            className="inline-flex min-h-[44px] items-center gap-2.5 text-ink"
          >
            <Logomark />
            <span className="font-serif text-lg font-semibold">Youth</span>
          </Link>

          <p className="kicker mt-8 justify-center before:hidden after:hidden">
            <span className="kicker-num">404</span>
          </p>

          <h1 className="t-title mt-3 text-ink">Halaman tidak ditemukan</h1>
          <p className="t-lead mt-4">
            Tautannya mungkin sudah berubah, atau halaman ini memang tidak pernah
            ada.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/" className="btn-primary">
              Ke halaman depan
            </Link>
            <Link href="/dashboard" className="btn-outline">
              Buka dashboard
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
