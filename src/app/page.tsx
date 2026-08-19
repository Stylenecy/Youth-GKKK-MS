import Link from "next/link";
import { getUpcomingGathering, getEvents, getCrosses } from "@/lib/data";
import type { StewardAssignment } from "@/lib/types";
import { Masthead, Logomark } from "@/components/Masthead";
import Preloader from "@/components/landing/Preloader";
import HeroCinematic from "@/components/landing/HeroCinematic";
import Reveal from "@/components/landing/Reveal";
import SectionKicker from "@/components/landing/SectionKicker";
import RhythmTimeline from "@/components/landing/RhythmTimeline";
import StewardVault from "@/components/landing/StewardVault";
import LivingHearth from "@/components/landing/LivingHearth";
import EmberField from "@/components/landing/EmberField";
import {
  formatWeekdayDayMonth,
  formatDayNumber,
  formatMonthShort,
  formatTime,
  countdownLabel,
  eventTypeLabel,
} from "@/lib/datetime";

// Regenerate hourly. The page is mostly static, but "Sabtu ini" must not
// go stale â€” without this it would freeze at build time.
export const revalidate = 3600;

/** Wednesday practice, Saturday practice, Saturday service, Cross. */
const RHYTHM = [
  { day: "Rabu", time: "19:00", title: "Latihan Awal", note: "Tim WL & singer + pemusik menyiapkan lagu" },
  { day: "Sabtu", time: "15:00", title: "Latihan Akhir", note: "Gladi bersih bersama Multimedia di Ruang Hermon" },
  { day: "Sabtu", time: "17:00", title: "Ibadah Pemuda", note: "Fellowship seluruh anggota Pemuda, di Ruang Hermon", highlight: true },
  { day: "TENTATIF", time: "BEBAS", title: "CROSS", note: "Kelompok kecil untuk bertumbuh bersama" },
];

export default async function LandingPage() {
  const [upcoming, events, crosses] = await Promise.all([
    getUpcomingGathering(),
    getEvents(),
    getCrosses(),
  ]);

  const now = Date.now();
  const agenda = events
    .filter((e) => new Date(e.date).getTime() > now && e.status !== "archived")
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(1, 5); // the first one is already the headline above

  const stewards = (upcoming?.stewardAssignments ?? []).filter(
    (s: StewardAssignment) => s.status !== "replaced"
  );

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <Preloader />
      <Masthead />

      <main id="main" className="flex-1">
        {/* -- 00: The mark, assembling -- */}
        <HeroCinematic />

        {/* -- 01: Warta minggu ini (Deep Obsidian Cypress Concept) -- */}
        <section
          id="warta"
          className="relative scroll-mt-20 overflow-hidden bg-[#0A1412] text-on-deep border-y border-rule-soft"
        >
          {/* Top Transition: Gradient Black to Deep Cypress */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-canvas via-[#0A1412]/90 to-transparent z-20"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-px bg-gradient-to-r from-transparent via-line-accent/50 to-transparent z-20"
          />

          {/* Floating Gold Embers */}
          <EmberField particleCount={20} speed={0.6} colorScheme="gold-only" />

          {/* Atmospheric Emerald/Gold Radial Bloom */}
          <div
            aria-hidden="true"
            className="bloom pointer-events-none"
            style={{
              width: "min(950px, 150vw)",
              height: "min(650px, 100vw)",
              left: "50%",
              top: "40%",
              transform: "translate(-50%, -50%)",
              opacity: 0.55,
              background: "radial-gradient(circle, rgba(123,160,108,0.12) 0%, rgba(253,190,2,0.06) 40%, transparent 70%)",
            }}
          />

          <div className="relative z-10 mx-auto w-full max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
            <Reveal>
              <SectionKicker
                number="01"
                title="Warta Minggu Ini"
                direction="left"
                align="left"
                numberColorClass="text-accent-on-deep"
              />
            </Reveal>

            {upcoming ? (
              <div className="mt-12 grid gap-10 lg:grid-cols-[1.35fr_1fr] lg:gap-16">
                <div>
                  <Reveal delay={0.05}>
                    {/* High-Impact Countdown & Service Headline */}
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="inline-flex items-center gap-2.5 rounded-full border border-line-accent bg-accent-wash/60 px-4 py-1.5 shadow-[0_0_16px_rgba(253,190,2,0.15)]">
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-80" />
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent" />
                        </span>
                        <span className="font-mono text-xs font-bold uppercase tracking-wider text-accent">
                          {countdownLabel(upcoming.date)}
                        </span>
                      </div>

                      <span className="tag border-line px-3.5 py-1.5 font-mono text-xs text-on-deep-muted">
                        {eventTypeLabel(upcoming.eventType)}
                      </span>
                    </div>

                    {/* The theme is the headline. Architectural & bold. */}
                    <h2 className="t-display mt-6 text-balance text-on-deep">
                      {upcoming.weeklyTheme}
                    </h2>
                  </Reveal>

                  <Reveal delay={0.12}>
                    <p className="t-lead mt-6 max-w-xl text-pretty text-on-deep-muted">
                      {upcoming.description}
                    </p>

                    {/* Luxury Architectural Metadata Shelf */}
                    <dl className="mt-10 grid grid-cols-2 gap-x-8 gap-y-6 border-y border-white/10 py-6 sm:grid-cols-4">
                      <div>
                        <dt className="font-mono text-[0.625rem] uppercase tracking-[0.2em] text-on-deep-muted/70">
                          ( Tanggal )
                        </dt>
                        <dd className="mt-2 font-serif text-lg font-semibold text-on-deep">
                          {formatWeekdayDayMonth(upcoming.date)}
                        </dd>
                      </div>
                      <div>
                        <dt className="font-mono text-[0.625rem] uppercase tracking-[0.2em] text-on-deep-muted/70">
                          ( Waktu )
                        </dt>
                        <dd className="num mt-2 font-serif text-lg font-semibold text-accent">
                          {formatTime(upcoming.date)} WIB
                        </dd>
                      </div>
                      <div>
                        <dt className="font-mono text-[0.625rem] uppercase tracking-[0.2em] text-on-deep-muted/70">
                          ( Tempat )
                        </dt>
                        <dd className="mt-2 font-serif text-lg font-semibold text-on-deep">
                          Ruang Hermon
                        </dd>
                      </div>
                      <div>
                        <dt className="font-mono text-[0.625rem] uppercase tracking-[0.2em] text-on-deep-muted/70">
                          ( Pembicara )
                        </dt>
                        <dd className="mt-2 font-serif text-lg font-semibold text-on-deep">
                          {upcoming.speakerName || "Pengurus Youth"}
                        </dd>
                      </div>
                    </dl>

                    <div className="mt-10 flex flex-wrap gap-4">
                      <Link href="/login" className="btn btn-primary">
                        Buka Dashboard Pengurus &rarr;
                      </Link>
                      <a href="#ritme" className="btn btn-outline">
                        Lihat Ritme Minggu
                      </a>
                    </div>
                  </Reveal>
                </div>

                {/* Who serves â€” Elsye Directory Card */}
                <Reveal delay={0.18}>
                  <aside className="card relative overflow-hidden p-6 sm:p-8 bg-surface/50 border border-white/10 backdrop-blur-xl transition-all duration-300 hover:border-line-accent hover:shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
                    <div className="flex items-center justify-between border-b border-white/10 pb-4">
                      <h3 className="font-mono text-[0.6875rem] uppercase tracking-[0.22em] text-on-deep-muted">
                        ( Penatalayan Ibadah )
                      </h3>
                      <span className="font-mono text-xs text-accent">
                        {stewards.length} Petugas
                      </span>
                    </div>

                    {stewards.length > 0 ? (
                      <ul className="mt-5 divide-y divide-white/5">
                        {stewards.map((s: StewardAssignment, idx: number) => (
                          <li
                            key={s.id}
                            className="group flex items-baseline justify-between gap-4 py-3.5 px-2 rounded-lg transition-colors hover:bg-surface-2/80 first:pt-2 last:pb-2"
                          >
                            <div className="flex items-baseline gap-3">
                              <span className="font-mono text-xs font-semibold text-ink-faint group-hover:text-accent transition-colors">
                                ( 0{idx + 1} )
                              </span>
                              <span className="font-serif text-lg font-medium text-on-deep group-hover:text-accent transition-colors">
                                {s.member?.nickname ?? s.member?.fullName ?? "Belum ditentukan"}
                              </span>
                            </div>
                            <span className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-on-deep-muted group-hover:text-on-deep transition-colors">
                              {s.role}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-6 text-sm text-on-deep-muted">
                        Penatalayan untuk ibadah ini belum ditetapkan.
                      </p>
                    )}

                    <div className="mt-6 border-t border-white/10 pt-4 flex items-center gap-3 text-xs text-on-deep-muted">
                      <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                      <span>Berhalangan hadir? Kabari pengurus lebih awal untuk jadwal pengganti.</span>
                    </div>
                  </aside>
                </Reveal>
              </div>
            ) : (
              <div className="mt-12 max-w-2xl">
                <h2 className="t-display text-balance text-on-deep">
                  Rumah digital pemuda GKKK Yogyakarta
                </h2>
                <p className="t-lead mt-6 text-on-deep-muted">
                  Pelayanan dan persekutuan pemuda berjalan aktif dalam ritme mingguan.
                  Jadwal ibadah mendatang sedang disiapkan oleh pengurus.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link href="/login" className="btn btn-primary">
                    Buka Dashboard Pengurus
                  </Link>
                  <a href="#ritme" className="btn btn-outline">
                    Lihat Ritme Minggu
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Transition: Gradient Deep Cypress to Black */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-b from-transparent via-[#0A1412]/90 to-canvas z-20"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-px bg-gradient-to-r from-transparent via-line-accent/50 to-transparent z-20"
          />
        </section>

        {/* -- 02: Ritme minggu (Dark Warm Bronze / Gold Gradient Concept) -- */}
        <section
          id="ritme"
          className="relative scroll-mt-20 overflow-hidden bg-[#181109] text-on-deep border-b border-rule-soft"
        >
          {/* Top Transition: Gradient Black to Dark Bronze Gold */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-canvas via-[#181109]/90 to-transparent z-20"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent z-20"
          />

          {/* Floating Gold Embers */}
          <EmberField particleCount={24} speed={0.65} colorScheme="gold-only" />

          {/* Warm Amber Radial Bloom */}
          <div
            aria-hidden="true"
            className="bloom pointer-events-none"
            style={{
              width: "min(950px, 150vw)",
              height: "min(650px, 100vw)",
              left: "50%",
              top: "45%",
              transform: "translate(-50%, -50%)",
              opacity: 0.6,
            }}
          />

          <div className="relative z-10 mx-auto w-full max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
            <Reveal>
              <SectionKicker
                number="02"
                title="Ritme Minggu"
                direction="right"
                align="right"
                numberColorClass="text-accent-on-deep"
              />
            </Reveal>

            <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_1.6fr] lg:gap-12 items-start">
              <Reveal delay={0.05} className="lg:sticky lg:top-28">
                <h2 className="t-title text-balance text-on-deep">
                  Pelayanan itu ritme, bukan sekadar acara
                </h2>
                <p className="t-lead mt-6 max-w-md text-pretty text-on-deep-muted">
                  Setiap minggu berjalan pada pola dan irama yang sama. Bagi kamu yang baru rindu melayani atau bersekutu, ini alur persiapan bersama kami.
                </p>

                <div className="mt-8 rounded-2xl border border-line-accent/40 bg-surface/40 p-6 backdrop-blur-xl">
                  <span className="font-mono text-[0.8rem] uppercase tracking-[0.2em] text-accent block mb-2 font-bold">
                    ( Fokus Pelayanan )
                  </span>
                  <p className="text-sm leading-relaxed text-on-deep-muted">
                    Ibadah Raya Pemuda di Sabtu 17:00 adalah pusat denyut persekutuan, disusul pembinaan sel di kelompok Cross.
                  </p>
                </div>
              </Reveal>

              <RhythmTimeline items={RHYTHM} />
            </div>
          </div>

          {/* Bottom Transition: Gradient Dark Bronze Gold to Black */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-b from-transparent via-[#181109]/90 to-canvas z-20"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent z-20"
          />
        </section>

        {/* -- 03: Agenda & Cross (Deep Midnight Plum & 5-Column Aurora Showcase) -- */}
        <section className="relative scroll-mt-20 overflow-hidden bg-[#130A1C] text-on-deep border-b border-rule-soft">
          {/* Top Transition: Gradient Black to Deep Midnight Plum */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-canvas via-[#130A1C]/90 to-transparent z-20"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-px bg-gradient-to-r from-transparent via-line-accent/50 to-transparent z-20"
          />

          {/* Floating Gold Embers */}
          <EmberField particleCount={24} speed={0.65} colorScheme="gold-only" />

          {/* Atmospheric Violet/Gold Radial Bloom */}
          <div
            aria-hidden="true"
            className="bloom pointer-events-none"
            style={{
              width: "min(950px, 150vw)",
              height: "min(650px, 100vw)",
              left: "50%",
              top: "40%",
              transform: "translate(-50%, -50%)",
              opacity: 0.55,
              background: "radial-gradient(circle, rgba(168,85,247,0.12) 0%, rgba(253,190,2,0.06) 40%, transparent 70%)",
            }}
          />

          <div className="relative z-10 mx-auto w-full max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
            <Reveal>
              <SectionKicker
                number="03"
                title="Agenda & Cross"
                direction="left"
                align="left"
                numberColorClass="text-accent-on-deep"
              />
            </Reveal>

            {/* Part A: Upcoming Agenda in Elsye Listing Style */}
            <div className="mt-12">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="font-mono text-xs font-semibold uppercase tracking-[0.22em] text-on-deep-muted">
                  Agenda Ibadah Mendatang
                </h3>
                <span className="font-mono text-xs text-on-deep-muted/70">
                  {agenda.length} Terjadwal
                </span>
              </div>

              {agenda.length > 0 ? (
                <ul className="divide-y divide-white/5">
                  {agenda.map((event, i) => (
                    <Reveal as="li" key={event.id} delay={0.05 * i}>
                      <div className="group flex flex-col gap-4 py-7 sm:flex-row sm:items-center sm:gap-8 transition-all duration-300 hover:bg-surface-2/40 px-4 rounded-xl hover:translate-x-1">
                        {/* Index and Calendar block */}
                        <div className="flex items-center gap-8 shrink-0 sm:w-28">
                          <span className="font-mono text-xs font-bold text-accent">
                            0{i + 1}
                          </span>
                          <div className="flex flex-col items-center justify-center rounded-lg border border-white/10 bg-surface/60 px-3 py-2 shadow-sm transition-colors group-hover:border-line-accent group-hover:bg-accent-wash/30">
                            <span className="num font-serif text-2xl font-bold leading-none text-on-deep group-hover:text-accent transition-colors">
                              {formatDayNumber(event.date)}
                            </span>
                            <span className="font-mono text-[0.625rem] uppercase tracking-[0.14em] text-on-deep-muted/70 mt-0.3">
                              {formatMonthShort(event.date)}
                            </span>
                          </div>
                        </div>

                        {/* Title and details */}
                        <div className="min-w-0 flex-1">
                          <h4 className="font-serif text-xl font-semibold text-on-deep group-hover:text-accent transition-colors">
                            {event.weeklyTheme}
                          </h4>
                          <p className="mt-1 text-sm leading-relaxed text-on-deep-muted line-clamp-2">
                            {event.description}
                          </p>
                        </div>

                        {/* Tags */}
                        <div className="flex shrink-0 flex-wrap items-center gap-2.5">
                          <span className="tag border-white/10 text-on-deep-muted">{eventTypeLabel(event.eventType)}</span>
                          <span
                            className={
                              event.status === "published" ? "tag tag-sage" : "tag"
                            }
                          >
                            {event.status === "published" ? "Terjadwal" : "Rencana"}
                          </span>
                        </div>
                      </div>
                    </Reveal>
                  ))}
                </ul>
              ) : (
                <p className="mt-8 border-t border-white/10 pt-8 text-on-deep-muted">
                  Belum ada agenda lain setelah ibadah terdekat.
                </p>
              )}
            </div>

            {/* Part B: Cross Groups with 5 Horizontal Columns & Vertical Aurora Beams */}
            {crosses.length > 0 && (
              <div className="mt-24">
                <Reveal delay={0.1}>
                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between border-b border-white/10 pb-5 gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                        <h3 className="font-mono text-xs font-bold uppercase tracking-[0.25em] text-accent">
                          Kelompok Pemuridan Cross
                        </h3>
                      </div>
                      <p className="t-lead mt-2 text-sm text-on-deep-muted">
                        Wadah kelompok kecil untuk bertumbuh bersama, menggali firman, dan saling mendoakan.
                      </p>
                    </div>
                    <span className="font-mono text-xs text-accent whitespace-nowrap">
                      ( 05 Kelompok Aktif )
                    </span>
                  </div>

                  {/* 5-Column Horizontal Luxury Cards Grid */}
                  <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    {crosses.map((c, idx) => (
                      <div
                        key={c.id}
                        className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-surface/35 p-6 backdrop-blur-2xl transition-all duration-500 hover:-translate-y-2 hover:border-accent hover:bg-surface/75 hover:shadow-[0_20px_48px_rgba(253,190,2,0.2)] min-h-[280px]"
                      >
                        {/* Vertical Aurora Light Pillar Background */}
                        <div
                          aria-hidden="true"
                          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-accent/25 via-accent/5 to-transparent opacity-60 group-hover:opacity-100 transition-opacity duration-700"
                        />
                        {/* Shimmering Vertical Laser Ray */}
                        <div
                          aria-hidden="true"
                          className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-12 h-full bg-gradient-to-b from-accent/30 via-accent/5 to-transparent blur-md group-hover:w-20 group-hover:from-accent/50 transition-all duration-500"
                        />
                        {/* Top Accent Rim */}
                        <div
                          aria-hidden="true"
                          className="pointer-events-none absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-accent to-transparent opacity-50 group-hover:opacity-100 transition-opacity"
                        />

                        {/* Top: Index & Label */}
                        <div className="relative z-10 flex items-center justify-between">
                          <span className="font-mono text-[0.625rem] font-bold uppercase tracking-[0.25em] text-accent">
                            CROSS
                          </span>
                          <span className="font-mono text-xs font-black text-on-deep-muted/60 group-hover:text-accent transition-colors">
                            ( 0{idx + 1} )
                          </span>
                        </div>

                        {/* Middle: Name & Description */}
                        <div className="relative z-10 my-auto py-4">
                          <h4 className="font-serif text-xl font-bold text-on-deep group-hover:text-accent transition-colors leading-tight">
                            {c.name}
                          </h4>
                          <p className="mt-3 text-xs text-on-deep-muted leading-relaxed line-clamp-3">
                            {c.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Reveal>
              </div>
            )}
          </div>

          {/* Bottom Transition: Gradient Deep Midnight Plum to Black */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-b from-transparent via-[#130A1C]/90 to-canvas z-20"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-px bg-gradient-to-r from-transparent via-line-accent/50 to-transparent z-20"
          />
        </section>

        {/* -- 04: Untuk pengurus (The Steward's Vault & Saturn Orbit) -- */}
        <StewardVault />

        {/* -- 05: Penutup (The Living Hearth & Scroll Assembly) -- */}
        <LivingHearth />
      </main>

      <footer className="relative overflow-hidden border-t border-rule-soft bg-canvas">
        {/* Large circular emblem watermark background element */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-16 -right-16 opacity-10 sm:-bottom-24 sm:-right-24"
        >
          <img
            src="/logo/derived/logo-super-transparent.svg"
            alt=""
            className="h-80 w-80 object-contain filter drop-shadow-[0_0_40px_rgba(253,190,2,0.4)] sm:h-96 sm:w-96"
          />
        </div>

        <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 py-12 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div className="flex items-center gap-3 text-ink">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-line-accent/50 bg-surface p-2 shadow-[0_0_16px_rgba(253,190,2,0.2)]">
              <Logomark className="h-full w-full" />
            </div>
            <span className="leading-tight">
              <span className="block font-serif text-lg sm:text-xl font-semibold tracking-tight">
                Youth GKKK
              </span>
              <span className="block font-mono text-[0.625rem] uppercase tracking-[0.22em] text-ink-faint">
                Komisi Pemuda GKKK Yogyakarta
              </span>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-ink-muted">
            <p className="text-ink-faint">
              &copy; {new Date().getFullYear()} &middot; Komisi Pemuda GKKK Yogyakarta
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}