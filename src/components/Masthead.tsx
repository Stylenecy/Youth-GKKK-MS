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
 * Open book + cross, drawn as strokes rather than a filled glyph so it sits
 * as a hairline next to the wordmark instead of competing with it.
 * Matches the ministry's own logo premise (Alkitab terbuka + salib).
 */
export function Logomark({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 28 28"
      className={`h-7 w-7 shrink-0 ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M14 9.5C11.8 7.8 9.2 7.2 5 7.2v13c4.2 0 6.8.6 9 2.3 2.2-1.7 4.8-2.3 9-2.3v-13c-4.2 0-6.8.6-9 2.3Z" />
      <path d="M14 9.5v13" />
      <path d="M14 1.8v4.6M11.9 4.1h4.2" className="text-accent" />
    </svg>
  );
}
