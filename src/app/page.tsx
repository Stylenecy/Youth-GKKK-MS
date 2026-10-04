import "@/components/landing/landing.css";
import LandingNav from "@/components/landing/LandingNav";
import Hero from "@/components/landing/Hero";
import LandingMotion from "@/components/landing/LandingMotion";
import { Agenda, Angka, Closing, CrossGroups, Makna, Pengurus, Ritme, Warta } from "@/components/landing/Sections";
import { getPublicBulletin, nextSaturdayService } from "@/lib/bulletin";
import { daysUntil, formatTime, formatWeekdayDayMonth } from "@/lib/datetime";

// The bulletin is the same for every visitor, so the page is rendered once
// and refreshed every ten minutes — often enough that "H–n" turns over
// shortly after midnight WIB, cheap enough to be served from cache.
export const revalidate = 600;

// Runs before first paint: marks the page as "motion will reveal this" so
// below-the-fold content does not flash before GSAP takes over. Skipped
// under reduced motion; landing.css has a 6 s failsafe if JS never comes.
const PREPAINT = `try{if(!matchMedia('(prefers-reduced-motion: reduce)').matches)document.documentElement.classList.add('lp-js')}catch(e){}`;

export default async function LandingPage() {
  const bulletin = await getPublicBulletin();
  const event = bulletin.upcoming[0] ?? null;
  const target = event ? new Date(event.date) : nextSaturdayService();
  const days = Math.max(0, daysUntil(target));
  const targetLabel = formatWeekdayDayMonth(target);
  const timeLabel = formatTime(target);
  // Rendered at build/revalidate time — that is exactly what "diperbarui" means.
  const updatedLabel =
    bulletin.source === "demo" ? "Data contoh (mode demo)" : `Diperbarui ${formatTime(new Date())}`;

  return (
    // Pinned dark: the dashboard theme toggle never touches the landing page.
    <div className="lp min-h-screen" data-theme="dark">
      <script dangerouslySetInnerHTML={{ __html: PREPAINT }} />
      <LandingNav />

      <main id="main">
        <Hero
          nextLabel={targetLabel}
          timeLabel={timeLabel}
          daysLabel={days === 0 ? "Hari ini" : `H–${days}`}
        />
        <Makna />
        <Warta
          event={event}
          latest={bulletin.latest}
          daysLabel={String(days).padStart(2, "0")}
          targetLabel={`${days === 0 ? "Hari ini" : "hari menuju"} ${targetLabel} · ${timeLabel}`}
          updatedLabel={updatedLabel}
        />
        <Ritme />
        <Agenda events={bulletin.upcoming.slice(1)} />
        <CrossGroups count={bulletin.counts.crosses} schedule={bulletin.crossSchedule} />
        <Angka counts={bulletin.counts} demo={bulletin.source === "demo"} />
        <Pengurus />
      </main>

      <Closing nextLabel={targetLabel} timeLabel={timeLabel} />
      <LandingMotion />
    </div>
  );
}
