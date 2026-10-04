import Link from "next/link";
import { Logomark } from "@/components/Masthead";

/** 404 in the house language: bracketed mono label, display title, one way back. */
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-canvas text-ink" data-theme="dark">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-7 lg:px-12">
        <Link href="/" className="group inline-flex min-h-[44px] items-center gap-3">
          <Logomark className="h-8 w-8" />
          <span className="font-serif text-[1.0625rem] tracking-tight transition-colors group-hover:text-accent">
            Youth GKKK
          </span>
        </Link>
        <p className="lp-meta">
          <span className="lp-bracket">Galat 404</span>
        </p>
      </header>

      <main id="main" className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-4 pb-16 sm:px-7 lg:px-12">
        <span className="lp-rule" aria-hidden="true" />
        <p className="lp-num mt-10 text-[clamp(5rem,3rem+8vw,10rem)] text-accent">404</p>
        <h1 className="lp-title mt-6 max-w-3xl text-[clamp(2.25rem,1.4rem+3vw,4rem)] text-ink">
          Halaman ini <em className="lp-italic">tidak ada</em>.
        </h1>
        <p className="mt-5 max-w-md text-base leading-relaxed text-ink-muted">
          Tautannya mungkin sudah berubah, atau halaman ini memang tidak pernah ada.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/" className="btn-primary">
            Ke halaman depan
          </Link>
          <Link href="/dashboard" className="btn-outline">
            Buka dashboard
          </Link>
        </div>
      </main>
    </div>
  );
}
