"use client";

import EmberCrest from "./EmberCrest";
import EmberField from "./EmberField";
import Reveal from "./Reveal";

const PILLARS = [
  {
    kicker: "01 / SEMANGAT",
    title: "Api",
    body: "Semangat membara pemuda yang hidup untuk menyembah dan memuliakan Tuhan dalam setiap gerak pelayanan.",
  },
  {
    kicker: "02 / PERSEKUTUAN",
    title: "Wadah",
    body: "Ruang yang aman dan hangat untuk bertumbuh bersama, saling menjaga, dan menopang pergumulan.",
  },
  {
    kicker: "03 / KESATUAN",
    title: "Satu Tubuh",
    body: "Banyak anggota dengan rupa-rupa karunia, tetapi satu tubuh yang terikat teguh dalam kasih Kristus.",
  },
];

export default function LivingHearth() {
  return (
    <section className="paper relative overflow-hidden border-b border-rule-soft py-16 sm:py-20">
      {/* Background Living Ember Stream */}
      <EmberField particleCount={28} speed={0.9} colorScheme="gold-only" />

      {/* Atmospheric radial ambient bloom */}
      <div
        aria-hidden="true"
        className="bloom pointer-events-none"
        style={{
          width: "min(700px, 130vw)",
          height: "min(700px, 130vw)",
          left: "50%",
          top: "35%",
          transform: "translate(-50%,-50%)",
          opacity: 0.75,
        }}
      />

      <div className="relative mx-auto w-full max-w-5xl px-5 text-center">
        {/* -- Direct Assembled Crest Stage with Refined Halo -- */}
        <Reveal>
          <div className="relative mx-auto flex items-center justify-center my-2">
            {/* Refined Circular Background Disc / Luminous Celestial Halo */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute h-48 w-48 sm:h-60 sm:w-60 rounded-full border border-line-accent/40 bg-surface/30 shadow-[0_0_70px_rgba(253,190,2,0.25)] backdrop-blur-2xl"
            />

            {/* Concentric Rotating Cosmic Ring */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute h-56 w-56 sm:h-68 sm:w-68 rounded-full border border-dashed border-accent/20 animate-spin"
              style={{ animationDuration: "60s" }}
            />

            {/* -- Fully Formed Glowing Living Crest -- */}
            <div className="relative z-10 flex h-44 w-44 sm:h-56 sm:w-56 items-center justify-center">
              <EmberCrest
                progress={1}
                reducedMotion={false}
                className="h-full w-full drop-shadow-[0_0_36px_rgba(253,190,2,0.6)]"
              />
            </div>
          </div>
        </Reveal>

        {/* -- 3-Pillar Architectural Minimalist Monoliths -- */}
        <div className="mt-8 sm:mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {PILLARS.map((p, idx) => (
            <Reveal key={p.kicker} delay={0.06 * idx}>
              <div className="group relative flex flex-col justify-between rounded-2xl bg-surface/30 p-5 sm:p-6 backdrop-blur-xl transition-all duration-300 hover:bg-surface/60 hover:-translate-y-1 text-left sm:text-center">
                {/* Glowing Top Hairline Accent */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute top-0 inset-x-8 h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent group-hover:via-accent transition-all"
                />

                <span className="font-mono text-[0.625rem] font-bold uppercase tracking-[0.25em] text-accent">
                  {p.kicker}
                </span>
                <h3 className="mt-1.5 font-serif text-xl sm:text-2xl font-bold text-ink group-hover:text-accent transition-colors">
                  {p.title}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-ink-muted">
                  {p.body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Hairline gold accent finale */}
        <Reveal delay={0.2}>
          <div className="mt-8 flex flex-col items-center justify-center">
            <hr className="hairline w-full max-w-xs" />
            <p className="mt-4 font-mono text-[0.6875rem] uppercase tracking-[0.34em] text-ink-faint">
              Api &middot; Wadah &middot; Satu Kesatuan
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}