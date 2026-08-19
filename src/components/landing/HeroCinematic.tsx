"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRef } from "react";
import { remap, useReducedMotion, useScrollProgress } from "@/lib/motion";

/**
 * The opening: the mark assembling itself out of the dark.
 *
 * A tall section holds a sticky viewport, so scrolling moves *time* rather
 * than the page. Over three acts the embers gather into the crest, the
 * meaning of each half of the mark is named, and the page hands off to the
 * bulletin below.
 *
 * The philosophy shown here is Dex's own, from the logo brief:
 *   Api   — semangat pemuda yang membara untuk memuliakan Tuhan
 *   Wadah — tempat pemuda bertumbuh bersama sebagai satu kesatuan
 *
 * The heading level is deliberately not h1. The front page's headline is the
 * week's worship theme, further down; this is the overture, not the news.
 */

const EmberCrest = dynamic(() => import("./EmberCrest"), {
  ssr: false,
});

export default function HeroCinematic() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const progress = useScrollProgress(sectionRef);
  const reduced = useReducedMotion();

  // The three acts deliberately overlap. An earlier cut had act 1 finished
  // at 0.30 while act 2 had only reached 0.20, which left a stretch of
  // scroll with nothing legible on screen — that reads as broken, not as
  // cinematic. `tests/motion.test.ts` guards the overlap.
  //
  // Act 1 — the sparks, before anything has a shape.
  const act1 = 1 - remap(progress, 0.06, 0.34);
  // Act 2 — the crest resolves; the two halves of the mark are named.
  const act2 = remap(progress, 0.16, 0.4) * (1 - remap(progress, 0.58, 0.74));
  // Act 3 — the mark is whole, and the page says what it is.
  const act3 = remap(progress, 0.6, 0.82);

  // How far along the embers are in finding the shape.
  const gather = remap(progress, 0.1, 0.72);

  return (
    <section
      ref={sectionRef}
      aria-label="Youth GKKK Jogja"
      style={{ height: reduced ? "100svh" : "300svh" }}
      className="relative bg-canvas"
    >
      <div className="sticky top-0 flex h-[100svh] items-center justify-center overflow-hidden">
        {/* Static crest underneath — this is what a visitor sees if WebGL is
            unavailable, the chunk fails, or they asked for reduced motion.
            It is never a blank rectangle. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
        >
          <div
            className="bloom"
            style={{
              width: "min(900px, 130vw)",
              height: "min(900px, 130vw)",
              opacity: 0.5 + gather * 0.5,
            }}
          />
          {reduced && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src="/logo/derived/logo-crest-vector.svg"
              alt=""
              width={180}
              height={250}
              style={{ filter: "drop-shadow(0 0 40px rgba(253,190,2,.4))" }}
            />
          )}
        </div>

        {!reduced && (
          <EmberCrest
            progress={gather}
            reducedMotion={reduced}
            className="absolute inset-0 h-full w-full"
          />
        )}

        {/* ── Act 1 ───────────────────────────────────────────── */}
        <div
          className="pointer-events-none absolute inset-x-0 top-[12%] sm:top-[14%] px-6 text-center"
          style={{
            opacity: reduced ? 1 : act1,
            transform: `translateY(${(1 - act1) * -26}px)`,
          }}
        >
          <p className="font-mono text-[0.7500rem] uppercase tracking-[0.42em] text-ink-faint">
            Komisi Pemuda GKKK Yogyakarta
          </p>
          <h1 className="mx-auto mt-3 flex flex-col items-center justify-center leading-none text-balance text-ink">
            <span className="font-handwriting text-6xl sm:text-8xl lg:text-[7.5rem] text-accent tracking-wide drop-shadow-[0_0_40px_rgba(253,190,2,0.5)] -rotate-3 transition-transform">
              Youth
            </span>
            <span className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-ink mt-2 sm:mt-3">
              GKKK
            </span>
            <span className="font-serif text-lg sm:text-2xl lg:text-3xl font-semibold tracking-[0.25em] sm:tracking-[0.35em] uppercase text-accent glow-gold mt-2 sm:mt-3 drop-shadow-[0_0_24px_rgba(253,190,2,0.5)]">
              Yogyakarta
            </span>
          </h1>
        </div>

        {/* -- Act 2: the two halves of the mark, named -- */}
        {!reduced && (
          <div
            className="pointer-events-none absolute inset-0 flex items-center justify-between px-6 sm:px-12 lg:px-20"
            style={{ opacity: act2 }}
          >
            <div className="max-w-[12rem] text-left sm:max-w-[18rem] lg:max-w-[22rem]">
              <span className="inline-block font-mono text-xs sm:text-sm font-bold uppercase tracking-[0.32em] text-accent border-b border-accent/40 pb-1">
                Api
              </span>
              <p className="mt-3 font-serif text-lg sm:text-1xl lg:text-2xl leading-snug text-ink drop-shadow-[0_0_20px_rgba(253,190,2,0.3)]">
                Semangat membara untuk memuliakan Tuhan.
              </p>
            </div>
            <div className="max-w-[12rem] text-right sm:max-w-[18rem] lg:max-w-[22rem]">
              <span className="inline-block font-mono text-xs sm:text-sm font-bold uppercase tracking-[0.32em] text-rose border-b border-rose/40 pb-1">
                Wadah
              </span>
              <p className="mt-3 font-serif text-lg sm:text-1xl lg:text-2xl leading-snug text-ink drop-shadow-[0_0_20px_rgba(224,86,36,0.3)]">
                Tempat bertumbuh bersama sebagai satu kesatuan.
              </p>
            </div>
          </div>
        )}

        {/* ── Act 3 ───────────────────────────────────────────── */}
        <div
          className="absolute inset-x-0 bottom-[9%] px-6 text-center"
          style={{
            opacity: reduced ? 1 : act3,
            transform: `translateY(${(1 - act3) * 22}px)`,
            pointerEvents: act3 > 0.6 || reduced ? "auto" : "none",
          }}
        >
          <p className="t-title text-balance text-ink">
            Satu api, <span className="glow-gold">satu wadah</span>
          </p>
          <p className="t-lead mx-auto mt-3 max-w-md text-pretty">
            Rumah digital Pemuda GKKK Yogyakarta. Jadwal, penatalayan, grup Cross,
            dan pelayanan yang utuh.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <a href="#warta" className="btn btn-primary">
              Warta minggu ini
            </a>
            <Link href="/login" className="btn btn-outline">
              Masuk Pengurus
            </Link>
          </div>
        </div>

        {/* Scroll cue — only while there is still something to scroll to. */}
        {!reduced && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center"
            style={{ opacity: 1 - remap(progress, 0, 0.12) }}
          >
            <span className="font-mono text-[0.625rem] uppercase tracking-[0.3em] text-ink-faint">
              Gulir
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
