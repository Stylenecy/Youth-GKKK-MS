import Link from "next/link";

/**
 * The bulletin masthead. Deliberately plain: a wordmark, the congregation
 * it belongs to, and one way in. The old navbar repeated the ministry name
 * again in the hero, which is why the page read as a template.
 */
export function Masthead() {
  return (
    <header className="sticky top-0 z-40 border-b border-rule bg-canvas/85 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-3.5 sm:px-8">
        <Link
          href="/"
          className="group flex min-h-[44px] items-center gap-2.5"
          aria-label="Space Youth GKKK — beranda"
        >
          <Logomark />
          <span className="leading-tight">
            <span className="block font-serif text-[1.0625rem] font-semibold tracking-tight text-ink">
              Space Youth
            </span>
            <span className="block font-mono text-[0.625rem] uppercase tracking-[0.16em] text-ink-faint">
              GKKK Yogyakarta
            </span>
          </span>
        </Link>

        <Link href="/login" className="btn btn-outline text-sm">
          Masuk
        </Link>
      </div>
    </header>
  );
}

/**
 * The ministry's own crest: cross + flame inside the "U" of YOUTH, standing
 * for the youth's burning spirit to glorify God, gathered as one body.
 * Finalized by the pengurus 16 Aug 2026 (see public/logo/BRAND-GUIDE_Youth-GKKK.md).
 */
export function Logomark({ className = "" }: { className?: string }) {
  return (
    <img
      src="/logo/derived/logo-crest-transparent-128.png"
      alt=""
      className={`h-7 w-7 shrink-0 object-contain ${className}`}
      aria-hidden="true"
    />
  );
}
