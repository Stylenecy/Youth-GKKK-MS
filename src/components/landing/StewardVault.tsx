"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Reveal from "./Reveal";
import SectionKicker from "./SectionKicker";
import EmberField from "./EmberField";
import { clamp, remap, useReducedMotion } from "@/lib/motion";

const MODULES = [
  {
    num: "01",
    tag: "Penatalayan",
    title: "Jadwal & Tugas",
    desc: "WL, Singer, Pemusik, Multimedia & Usher",
  },
  {
    num: "02",
    tag: "Komunitas",
    title: "Direktori & Cross",
    desc: "Database Jemaat & Presensi Kelompok",
  },
  {
    num: "03",
    tag: "Liturgi",
    title: "Warta & Khotbah",
    desc: "Tema Ibadah & Sinopsis Firman",
  },
  {
    num: "04",
    tag: "Arsip",
    title: "Notulen & Rapat",
    desc: "Dokumentasi Evaluasi Pelayanan",
  },
];

export default function StewardVault() {
  const sectionRef = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const [scrollProgress, setScrollProgress] = useState(0);
  const [idleAngle, setIdleAngle] = useState(0);

  useEffect(() => {
    if (reduced) return;
    const el = sectionRef.current;
    if (!el) return;

    let frame: number | null = null;
    const onScroll = () => {
      frame = null;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || 800;
      const p = clamp(1 - (rect.top - vh * 0.1) / (rect.height + vh * 0.8));
      setScrollProgress(p);
    };

    const request = () => {
      if (frame === null) frame = requestAnimationFrame(onScroll);
    };

    onScroll();
    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", request);

    let animId: number;
    let t = 0;
    const loop = () => {
      t += 0.0035;
      setIdleAngle(t);
      animId = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      window.removeEventListener("scroll", request);
      window.removeEventListener("resize", request);
      if (frame !== null) cancelAnimationFrame(frame);
      cancelAnimationFrame(animId);
    };
  }, [reduced]);

  const totalRotation = reduced ? 0 : scrollProgress * Math.PI * 2.4 + idleAngle;

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden bg-deep text-on-deep"
    >
      {/* -- Top Transition: Gradient Black (Canvas) to Red (Deep Maroon) -- */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-0 right-0 h-36 bg-gradient-to-b from-canvas via-deep/90 to-transparent z-20"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-px bg-gradient-to-r from-transparent via-line-accent/70 to-transparent z-20"
      />

      {/* -- Unified Giant Atmospheric Crest Watermark in Background -- */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 select-none opacity-10"
      >
        <img
          src="/logo/derived/logo-super-transparent.svg"
          alt=""
          className="h-[1100px] w-[1100px] sm:h-[1550px] sm:w-[1550px] lg:h-[1800px] lg:w-[1800px] max-w-none object-contain filter drop-shadow-[0_0_160px_rgba(253,190,2,0.35)]"
        />
      </div>

      {/* Floating Ember Dust Canvas */}
      <EmberField particleCount={36} speed={0.7} colorScheme="gold-maroon" />

      {/* Radial Atmospheric Bloom */}
      <div
        aria-hidden="true"
        className="bloom pointer-events-none"
        style={{
          width: "min(1200px, 170vw)",
          height: "min(900px, 130vw)",
          left: "50%",
          top: "40%",
          transform: "translate(-50%, -50%)",
          opacity: 0.75,
        }}
      />

      <div className="relative z-10 mx-auto w-full max-w-6xl px-5 pt-32 pb-36 sm:px-8 sm:pt-40 sm:pb-48 text-center">
        {/* Centered Kicker 04 & Title */}
        <Reveal>
          <div className="flex flex-col items-center justify-center">
            <SectionKicker
              number="04"
              title="Untuk Pengurus"
              align="center"
              direction="center"
              numberColorClass="text-accent-on-deep"
            />

            <h2 className="t-display mt-8 max-w-3xl text-balance text-on-deep mx-auto">
              Pintu Masuk Pengurus & Pelayan
            </h2>
            <p className="t-lead mt-5 max-w-2xl text-pretty text-on-deep-muted mx-auto">
              Akses dashboard internal untuk penyusunan jadwal ibadah, penatalayan, kelompok Cross, notulen rapat, dan arsip pelayanan Komisi Pemuda GKKK Yogyakarta.
            </p>
          </div>
        </Reveal>

        {/* -- Saturn Orbital System: Grand Realistic Scale -- */}
        <div className="relative mt-24 sm:mt-32 flex items-center justify-center min-h-[560px] sm:min-h-[720px]">
          {/* Realistic Saturn's Multi-Band Glowing Rings (SVG) */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
          >
            {/* Outer Diffuse Corona Ring */}
            <div
              className="absolute w-[360px] h-[190px] sm:w-[940px] sm:h-[400px] rounded-[50%] border border-accent/20 shadow-[0_0_80px_rgba(253,190,2,0.15)]"
              style={{ transform: "rotate(-11deg)" }}
            />
            {/* Primary Sharp Metallic Ring */}
            <div
              className="absolute w-[320px] h-[165px] sm:w-[840px] sm:h-[340px] rounded-[50%] border-2 border-accent/40 shadow-[0_0_40px_rgba(253,190,2,0.25)]"
              style={{ transform: "rotate(-11deg)" }}
            />
            {/* Secondary Dashed Ring */}
            <div
              className="absolute w-[280px] h-[140px] sm:w-[740px] sm:h-[290px] rounded-[50%] border border-dashed border-accent/30"
              style={{ transform: "rotate(-11deg)" }}
            />
            {/* Inner Ring */}
            <div
              className="absolute w-[240px] h-[115px] sm:w-[620px] sm:h-[230px] rounded-[50%] border border-line-accent/30"
              style={{ transform: "rotate(-11deg)" }}
            />
          </div>

          {/* -- Center Core: Grand Planetary Command Sphere with Gradient Rim -- */}
          <div className="relative z-20 flex flex-col items-center justify-center">
            {/* Multi-layered Pulsing Solar Corona */}
            <div
              aria-hidden="true"
              className="absolute -inset-12 sm:-inset-20 rounded-full bg-accent/20 blur-3xl animate-pulse"
            />
            <div
              aria-hidden="true"
              className="absolute -inset-6 sm:-inset-10 rounded-full bg-rose/25 blur-2xl"
            />

            {/* Gradient Border Wrapper */}
            <div className="p-[2.5px] rounded-full bg-gradient-to-tr from-accent via-rose to-accent shadow-[0_0_90px_rgba(253,190,2,0.45)] transition-transform duration-500 hover:scale-105">
              <div className="relative flex flex-col items-center justify-center rounded-full bg-[#1c070d]/95 p-8 sm:p-14 shadow-[inset_0_0_50px_rgba(253,190,2,0.15)] backdrop-blur-3xl text-center w-64 h-64 sm:w-84 sm:h-84">
                <span className="font-serif text-2xl sm:text-4xl font-bold text-ink">
                  Gerbang
                </span>
                <span className="font-serif text-xl sm:text-3xl font-light italic text-accent">
                  Pelayanan
                </span>

                <p className="mt-2 text-[0.6875rem] sm:text-xs text-on-deep-muted leading-relaxed max-w-[200px] hidden sm:block">
                  Jadwal, direktori jemaat, dan arsip pelayanan terpadu.
                </p>

                <div className="mt-4 sm:mt-5">
                  <Link
                    href="/login"
                    className="btn btn-primary px-6 py-2.5 sm:px-7 sm:py-3 text-xs sm:text-sm font-bold shadow-[0_0_28px_rgba(253,190,2,0.45)] hover:scale-105 transition-transform"
                  >
                    Masuk ke Dashboard &rarr;
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* -- 4 Large Orbiting Realistic Celestial Bodies with Gradient Rims -- */}
          {MODULES.map((mod, idx) => {
            const baseAngle = (idx * Math.PI) / 2;
            const angle = baseAngle + totalRotation;

            const tilt = (-11 * Math.PI) / 180;
            const cosTilt = Math.cos(tilt);
            const sinTilt = Math.sin(tilt);

            const isClient = typeof window !== "undefined";
            const isMobile = isClient && window.innerWidth < 640;
            const rx = isMobile ? 180 : 440;
            const ry = isMobile ? 95 : 180;

            const rawX = Math.cos(angle) * rx;
            const rawY = Math.sin(angle) * ry;

            const rotatedX = rawX * cosTilt - rawY * sinTilt;
            const rotatedY = rawX * sinTilt + rawY * cosTilt;

            const zDepth = Math.sin(angle);
            const isFront = zDepth > 0;
            const orbScale = reduced ? 1 : remap(zDepth, -1, 1, 0.85, 1.15);
            const orbOpacity = reduced ? 1 : remap(zDepth, -1, 1, 0.65, 1);
            const zIndex = isFront ? 30 : 10;

            return (
              <div
                key={mod.num}
                className="absolute flex items-center justify-center transition-transform duration-75"
                style={{
                  transform: `translate(${rotatedX}px, ${rotatedY}px) scale(${orbScale})`,
                  opacity: orbOpacity,
                  zIndex,
                }}
              >
                {/* Gradient Border Wrapper */}
                <div className="group p-[1.5px] rounded-full bg-gradient-to-tr from-accent/90 via-white/30 to-rose/90 shadow-[0_16px_48px_rgba(0,0,0,0.7)] transition-all duration-300 hover:scale-115 hover:shadow-[0_0_40px_rgba(253,190,2,0.6)]">
                  {/* Realistic Spherical Celestial Glass Orb */}
                  <div className="relative flex h-32 w-32 sm:h-44 sm:w-44 flex-col items-center justify-center rounded-full bg-[#250a12]/95 p-4 text-center shadow-[inset_0_2px_12px_rgba(255,255,255,0.2)] backdrop-blur-2xl">
                    {/* Spherical Atmospheric Gloss Highlight */}
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute top-1 left-1/2 -translate-x-1/2 h-6 w-20 rounded-full bg-gradient-to-b from-white/30 to-transparent blur-xs"
                    />

                    <span className="font-mono text-[0.625rem] sm:text-xs font-black text-accent">
                      ( {mod.num} )
                    </span>

                    <h4 className="mt-1 font-serif text-xs sm:text-base font-bold text-on-deep leading-tight group-hover:text-accent transition-colors">
                      {mod.title}
                    </h4>

                    <p className="mt-1.5 hidden sm:block text-[0.625rem] text-on-deep-muted leading-tight line-clamp-2 px-2">
                      {mod.desc}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* -- Bottom Transition: Gradient Red (Deep Maroon) to Black (Canvas) -- */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-0 right-0 h-36 bg-gradient-to-b from-transparent via-deep/90 to-canvas z-20"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-px bg-gradient-to-r from-transparent via-line-accent/70 to-transparent z-20"
      />
    </section>
  );
}