import Link from "next/link";

/**
 * The bulletin masthead. Deliberately plain: a wordmark, the congregation
 * it belongs to, and one way in. The old navbar repeated the ministry name
 * again in the hero, which is why the page read as a template.
 */
export function Masthead() {
  return (
    <header className="sticky top-3.5 sm:top-5 z-50 px-4 sm:px-6 pointer-events-none">
      <nav className="pointer-events-auto mx-auto flex w-full max-w-4xl items-center justify-between gap-4 rounded-full border border-line-accent/40 bg-surface/75 px-4 py-2 sm:px-6 sm:py-2.5 shadow-[0_16px_40px_rgba(0,0,0,0.6),0_0_24px_rgba(253,190,2,0.12)] backdrop-blur-2xl transition-all duration-300 hover:border-accent/60 hover:bg-surface/85">
        <Link
          href="/"
          className="group flex items-center gap-2.5 sm:gap-3"
          aria-label="Youth GKKK — Beranda"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-line-accent/30 bg-surface/80 p-1 shadow-sm transition-transform group-hover:scale-110">
            <Logomark className="h-full w-full" />
          </div>
          <span className="leading-tight">
            <span className="block font-serif text-sm sm:text-base font-bold tracking-tight text-ink group-hover:text-accent transition-colors">
              Youth
            </span>
            <span className="block font-mono text-[0.5625rem] uppercase tracking-[0.2em] text-ink-faint">
              GKKK Yogyakarta
            </span>
          </span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="#warta"
            className="hidden sm:inline-flex px-3.5 py-1.5 rounded-full text-xs font-mono text-ink-muted hover:text-accent transition-colors"
          >
            Warta
          </Link>
          <Link
            href="#ritme"
            className="hidden sm:inline-flex px-3.5 py-1.5 rounded-full text-xs font-mono text-ink-muted hover:text-accent transition-colors"
          >
            Ritme
          </Link>
          <Link
            href="/login"
            className="btn btn-primary text-xs px-4 py-1.5 sm:px-5 sm:py-2 rounded-full font-bold shadow-[0_0_16px_rgba(253,190,2,0.3)] hover:scale-105 transition-transform"
          >
            Masuk &rarr;
          </Link>
        </div>
      </nav>
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
      src="/logo/derived/logo-super-transparent.svg"
      alt="Youth GKKK Crest"
      className={`h-7 w-7 shrink-0 object-contain ${className}`}
      aria-hidden="true"
    />
  );
}
