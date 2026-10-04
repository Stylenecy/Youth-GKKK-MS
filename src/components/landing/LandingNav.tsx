import Link from "next/link";
import { Logomark } from "@/components/Masthead";

const LINKS = [
  { href: "#warta", n: "01", label: "Warta" },
  { href: "#ritme", n: "02", label: "Ritme" },
  { href: "#agenda", n: "03", label: "Agenda" },
  { href: "#cross", n: "04", label: "Cross" },
];

/**
 * The landing nav: wordmark, four numbered anchors, one way in. It hides
 * while reading downward and returns on the first scroll up (LandingMotion
 * toggles the classes); keyboard focus always brings it back.
 */
export default function LandingNav() {
  return (
    <header data-nav className="lp-nav">
      <nav
        aria-label="Navigasi utama"
        className="lp-wrap flex h-16 items-center justify-between gap-4"
      >
        <Link href="/" className="group flex items-center gap-3" aria-label="Youth GKKK — Beranda">
          <Logomark className="h-8 w-8" />
          <span className="whitespace-nowrap leading-none">
            <span className="block font-serif text-[1.0625rem] font-medium tracking-tight text-ink transition-colors group-hover:text-accent">
              Youth GKKK
            </span>
            <span className="lp-meta mt-1 block text-[0.625rem]">Jogja</span>
          </span>
        </Link>

        <ul className="hidden items-center gap-7 lg:flex">
          {LINKS.map((l) => (
            <li key={l.href}>
              <a href={l.href} className="lp-link lp-meta text-ink-muted hover:text-ink">
                <span className="text-accent" aria-hidden="true">
                  {l.n}
                </span>
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <Link href="/login" className="lp-btn lp-btn-ghost min-h-[44px] px-5 text-sm" data-magnetic>
          {/* One flex item, so the button's gap does not split the label. */}
          <span>
            Masuk<span className="hidden sm:inline"> pengurus</span>
          </span>
          <span aria-hidden="true" className="lp-arrow">
            &rarr;
          </span>
        </Link>
      </nav>
    </header>
  );
}
