import Link from "next/link";
import type { CSSProperties } from "react";
import SplitChars from "./SplitChars";

/** Rising embers: x position (% of the crest box), drift, duration, delay. */
const EMBERS = [
  { x: 48, dx: -14, t: 6.4, d: 0.2 },
  { x: 54, dx: 18, t: 7.2, d: 1.6 },
  { x: 44, dx: -22, t: 5.8, d: 3.1 },
  { x: 58, dx: 10, t: 6.9, d: 2.4 },
  { x: 50, dx: 4, t: 8.1, d: 4.2 },
  { x: 41, dx: -6, t: 7.6, d: 5.3 },
  { x: 61, dx: 24, t: 6.1, d: 0.9 },
];

const d = (s: number) => ({ "--d": `${s}s` }) as CSSProperties;

/**
 * The opening screen. One idea, from the logo brief: the flame is the
 * youth's spirit (api), the vessel is the body they grow in (wadah).
 *
 * The entrance is CSS keyframes only, so it plays from first paint with no
 * JavaScript; under reduced motion everything is simply there.
 */
export default function Hero({
  nextLabel,
  timeLabel,
  daysLabel,
}: {
  /** e.g. "Sabtu, 10 Oktober" — the next youth gathering. */
  nextLabel: string;
  /** e.g. "17.00 WIB". */
  timeLabel: string;
  /** e.g. "H–6" / "Hari ini". */
  daysLabel: string;
}) {
  return (
    <section aria-label="Pembuka" className="lp-hero" data-hero>
      <div className="lp-wrap flex flex-1 flex-col pb-8 pt-20 sm:pt-24 lg:pb-10">
        <div className="lp-grid lp-in-fade" style={d(0)} aria-hidden="true" />

        {/* Meta row */}
        <div className="relative grid grid-cols-2 gap-x-4 gap-y-2 lg:grid-cols-12">
          <p className="lp-meta lp-in-fade lg:col-span-4" style={d(0.15)}>
            <span className="text-accent">00</span>&nbsp; Komisi Pemuda GKKK Jogja
          </p>
          <p className="lp-meta lp-in-fade text-right lg:col-span-4 lg:text-center" style={d(0.22)}>
            Ibadah Pemuda · Sabtu 17.00 WIB
          </p>
          <p className="lp-meta lp-in-fade hidden text-right lg:col-span-4 lg:block" style={d(0.29)}>
            Ruang Hermon
          </p>
          <span className="lp-rule lp-in-draw col-span-2 mt-3 lg:col-span-12" style={d(0.1)} />
        </div>

        {/* Crest + headline */}
        <div className="relative grid flex-1 grid-cols-1 items-end gap-8 pt-8 lg:grid-cols-12 lg:gap-6 lg:pt-6">
          <div
            className="relative mx-auto w-[42vw] max-w-[220px] lg:absolute lg:right-[4%] lg:top-1/2 lg:w-[min(28vw,400px)] lg:max-w-none lg:-translate-y-[54%]"
            aria-hidden="true"
            data-hero-crest
          >
            <div
              className="lp-hero-bloom"
              style={{ width: "220%", aspectRatio: "1", left: "50%", top: "52%", transform: "translate(-50%, -50%)" }}
            />
            {EMBERS.map((e, i) => (
              <span
                key={i}
                className="lp-ember"
                style={{ left: `${e.x}%`, "--dx": `${e.dx}px`, "--t": `${e.t}s`, "--d": `${e.d}s` } as CSSProperties}
              />
            ))}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/crest-384.webp"
              srcSet="/brand/crest-384.webp 384w, /brand/crest-768.webp 768w"
              sizes="(min-width: 1024px) min(28vw, 400px), 42vw"
              width={384}
              height={515}
              alt=""
              fetchPriority="high"
              className="lp-in-settle relative h-auto w-full"
              style={d(0.35)}
            />
          </div>

          <div className="relative lg:col-span-9">
            <h1 className="lp-mega lp-in-chars text-ink" data-hero-title>
              <SplitChars
                label="Youth GKKK Jogja. Satu api, satu wadah."
                lines={[
                  {
                    delay: 0.45,
                    words: [
                      { text: "Satu" },
                      { text: "api", className: "lp-italic text-accent" },
                      { text: ",", tight: true },
                    ],
                  },
                  { delay: 0.62, words: [{ text: "satu" }, { text: "wadah." }] },
                ]}
              />
            </h1>

            <div className="mt-8 flex flex-col gap-8 lg:mt-10 xl:flex-row xl:items-end xl:justify-between">
              <p className="lp-lead lp-in-fade" style={d(0.8)}>
                Rumah digital Pemuda GKKK Jogja: warta Sabtu ini, irama pelayanan tiap minggu,
                kelompok Cross, dan ruang kerja pengurus.
              </p>
              <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
                <a href="#warta" className="lp-btn lp-btn-primary lp-in-fade" style={d(0.92)} data-magnetic>
                  Lihat warta Sabtu ini
                  <span aria-hidden="true" className="lp-arrow">
                    &darr;
                  </span>
                </a>
                <Link href="/login" className="lp-btn lp-btn-ghost lp-in-fade" style={d(1)} data-magnetic>
                  Masuk ruang pengurus
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom row */}
        <div className="relative mt-10 grid grid-cols-2 items-end gap-4 lg:mt-12 lg:grid-cols-12">
          <span className="lp-rule lp-in-draw col-span-2 mb-4 lg:col-span-12" style={d(0.5)} />
          <p className="lp-meta lp-in-fade lg:col-span-4" style={d(1.05)}>
            <span className="block text-ink-muted">Pertemuan berikutnya</span>
            {nextLabel} · {timeLabel}
          </p>
          <p className="lp-meta lp-in-fade text-right lg:col-span-4 lg:text-center" style={d(1.12)}>
            <span className="lp-num block text-[2rem] text-ink sm:text-[2.5rem]">{daysLabel}</span>
          </p>
          <div className="hidden items-end justify-end gap-3 lg:col-span-4 lg:flex">
            <span className="lp-meta lp-in-fade" style={d(1.2)}>
              Gulir
            </span>
            <span className="relative block h-10 w-px overflow-hidden bg-rule" aria-hidden="true">
              <span className="lp-cue absolute inset-0 bg-accent" />
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
