import Link from "next/link";
import { getUpcomingGathering, getEvents, getCrosses } from "@/lib/data";
import type { StewardAssignment } from "@/lib/types";
import { Masthead, Logomark } from "@/components/Masthead";
import {
  formatWeekdayDayMonth,
  formatDayNumber,
  formatMonthShort,
  formatTime,
  countdownLabel,
  eventTypeLabel,
} from "@/lib/datetime";

// Regenerate hourly. The page is mostly static, but "Sabtu ini" must not
// go stale — without this it would freeze at build time.
export const revalidate = 3600;

/** Wednesday practice, Saturday practice, Saturday service, Cross. */
const RHYTHM = [
  { day: "Rabu", time: "19:00", title: "Latihan Musik", note: "Tim musik & singer menyiapkan lagu" },
  { day: "Sabtu", time: "15:00", title: "Latihan Akhir", note: "Gladi bersih bersama multimedia di Ruang Hermon" },
  { day: "Sabtu", time: "17:00", title: "Ibadah Pemuda", note: "Ibadah bersama seluruh pemuda, di Ruang Hermon", highlight: true },
  { day: "Sabtu", time: "19:00", title: "Cross", note: "Kelompok kecil — bertumbuh bersama" },
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
      <Masthead />

      <main id="main" className="flex-1">
        {/* ── 01 · Warta minggu ini ─────────────────────────────── */}
        <section className="paper border-b border-rule">
          <div className="mx-auto w-full max-w-6xl px-5 py-14 sm:px-8 sm:py-20 lg:py-24">
            <p className="kicker rise">
              <span className="kicker-num">01</span> Warta Minggu Ini
            </p>

            {upcoming ? (
              <div className="mt-8 grid gap-10 lg:grid-cols-[1.35fr_1fr] lg:gap-16">
                <div>
                  <div className="rise rise-1 flex flex-wrap items-center gap-2.5">
                    <span className="tag tag-accent">
                      {eventTypeLabel(upcoming.eventType)}
                    </span>
                    <span className="tag">{countdownLabel(upcoming.date)}</span>
                  </div>

                  {/* The theme is the headline. Not the product name. */}
                  <h1 className="t-display rise rise-1 mt-5 text-balance text-ink">
                    {upcoming.weeklyTheme}
                  </h1>

                  <p className="t-lead rise rise-2 mt-6 max-w-xl text-pretty">
                    {upcoming.description}
                  </p>

                  <dl className="rise rise-2 mt-8 flex flex-wrap gap-x-10 gap-y-5">
                    <div>
                      <dt className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-ink-faint">
                        Tanggal
                      </dt>
                      <dd className="mt-1.5 font-serif text-lg font-semibold text-ink">
                        {formatWeekdayDayMonth(upcoming.date)}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-ink-faint">
                        Waktu
                      </dt>
                      <dd className="num mt-1.5 font-serif text-lg font-semibold text-ink">
                        {formatTime(upcoming.date)}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-ink-faint">
                        Tempat
                      </dt>
                      <dd className="mt-1.5 font-serif text-lg font-semibold text-ink">
                        Ruang Hermon
                      </dd>
                    </div>
                    {upcoming.speakerName && (
                      <div>
                        <dt className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-ink-faint">
                          Pembicara
                        </dt>
                        <dd className="mt-1.5 font-serif text-lg font-semibold text-ink">
                          {upcoming.speakerName}
                        </dd>
                      </div>
                    )}
                  </dl>

                  <div className="rise rise-3 mt-9 flex flex-wrap gap-3">
                    <Link href="/login" className="btn btn-primary">
                      Buka Dashboard Pengurus
                    </Link>
                    <a href="#ritme" className="btn btn-outline">
                      Lihat Ritme Minggu
                    </a>
                  </div>
                </div>

                {/* Who serves — named, with their role. The whole point of
                    penatalayan is being named, so names get the space that
                    decorative avatar circles used to occupy. */}
                <aside className="rise rise-3 card p-6 sm:p-7">
                  <h2 className="font-mono text-[0.6875rem] uppercase tracking-[0.18em] text-ink-faint">
                    Yang Melayani · {formatWeekdayDayMonth(upcoming.date)}
                  </h2>

                  {stewards.length > 0 ? (
                    <ul className="mt-5 divide-y divide-rule-soft">
                      {stewards.map((s: StewardAssignment) => (
                        <li
                          key={s.id}
                          className="flex items-baseline justify-between gap-4 py-3 first:pt-0 last:pb-0"
                        >
                          <span className="font-serif text-lg font-medium text-ink">
                            {s.member?.nickname ?? s.member?.fullName ?? "Belum ditentukan"}
                          </span>
                          <span className="font-mono text-xs uppercase tracking-[0.1em] text-ink-muted">
                            {s.role}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-5 text-sm text-ink-muted">
                      Penatalayan untuk ibadah ini belum ditetapkan.
                    </p>
                  )}

                  <p className="mt-6 border-t border-rule-soft pt-4 text-sm leading-relaxed text-ink-muted">
                    Berhalangan hadir? Kabari pengurus GKKK Jogja lebih awal supaya penggantinya sempat berlatih.
                  </p>
                </aside>
              </div>
            ) : (
              <div className="mt-8 max-w-2xl">
                <h1 className="t-display text-balance text-ink">
                  Rumah digital pemuda GKKK Yogyakarta
                </h1>
                <p className="t-lead mt-6">
                  Belum ada jadwal ibadah yang tercatat. Pengurus dapat
                  menambahkannya lewat dashboard.
                </p>
                <Link href="/login" className="btn btn-primary mt-8">
                  Buka Dashboard Pengurus
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* ── 02 · Ritme minggu ─────────────────────────────────── */}
        <section
          id="ritme"
          className="scroll-mt-20 border-b border-rule bg-canvas-sunk"
        >
          <div className="mx-auto w-full max-w-6xl px-5 py-14 sm:px-8 sm:py-20">
            <p className="kicker">
              <span className="kicker-num">02</span> Ritme Minggu
            </p>

            <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_1.6fr] lg:gap-16">
              <div>
                <h2 className="t-title text-balance text-ink">
                  Pelayanan itu ritme, bukan acara
                </h2>
                <p className="t-lead mt-5 max-w-md text-pretty">
                  Setiap minggu berjalan pada pola yang sama. Kalau kamu baru,
                  ini yang perlu kamu tahu untuk ikut.
                </p>
              </div>

              <ol className="relative">
                {RHYTHM.map((r, i) => (
                  <li
                    key={`${r.day}-${r.time}`}
                    className="relative flex gap-5 pb-7 last:pb-0 sm:gap-7"
                  >
                    {/* connector line */}
                    {i < RHYTHM.length - 1 && (
                      <span
                        aria-hidden="true"
                        className="absolute left-[4.25rem] top-3 h-full w-px bg-rule sm:left-[5.25rem]"
                      />
                    )}

                    <div className="w-16 shrink-0 text-right sm:w-20">
                      <span className="block font-mono text-[0.625rem] uppercase tracking-[0.14em] text-ink-faint">
                        {r.day}
                      </span>
                      <span className="num block font-serif text-lg font-semibold text-ink">
                        {r.time}
                      </span>
                    </div>

                    <span
                      aria-hidden="true"
                      className={`relative z-10 mt-2 h-2.5 w-2.5 shrink-0 rounded-full ring-4 ring-canvas-sunk ${
                        r.highlight ? "bg-accent" : "bg-rule"
                      }`}
                    />

                    <div className="min-w-0 pt-0.5">
                      <h3
                        className={`font-serif text-lg font-semibold ${
                          r.highlight ? "text-accent" : "text-ink"
                        }`}
                      >
                        {r.title}
                      </h3>
                      <p className="mt-0.5 text-sm leading-relaxed text-ink-muted">
                        {r.note}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* ── 03 · Agenda ───────────────────────────────────────── */}
        <section className="paper border-b border-rule">
          <div className="mx-auto w-full max-w-6xl px-5 py-14 sm:px-8 sm:py-20">
            <p className="kicker">
              <span className="kicker-num">03</span> Agenda Berikutnya
            </p>

            {agenda.length > 0 ? (
              <ul className="mt-8 border-t border-rule">
                {agenda.map((event) => (
                  <li key={event.id}>
                    <div className="flex flex-col gap-3 border-b border-rule py-6 sm:flex-row sm:items-center sm:gap-8">
                      {/* Date block — the calendar-tear device from printed bulletins */}
                      <div className="flex w-16 shrink-0 flex-row items-baseline gap-2 sm:flex-col sm:items-center sm:gap-0">
                        <span className="num font-serif text-3xl font-semibold leading-none text-ink">
                          {formatDayNumber(event.date)}
                        </span>
                        <span className="font-mono text-[0.625rem] uppercase tracking-[0.14em] text-ink-faint sm:mt-1">
                          {formatMonthShort(event.date)}
                        </span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="t-subtitle text-ink">
                          {event.weeklyTheme}
                        </h3>
                        <p className="mt-1 text-sm leading-relaxed text-ink-muted">
                          {event.description}
                        </p>
                      </div>

                      <div className="flex shrink-0 flex-wrap items-center gap-2">
                        <span className="tag">{eventTypeLabel(event.eventType)}</span>
                        <span
                          className={
                            event.status === "published" ? "tag tag-sage" : "tag"
                          }
                        >
                          {event.status === "published" ? "Terjadwal" : "Rencana"}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-8 border-t border-rule pt-8 text-ink-muted">
                Belum ada agenda lain setelah ibadah terdekat.
              </p>
            )}

            {crosses.length > 0 && (
              <div className="mt-12">
                <h3 className="font-mono text-[0.6875rem] uppercase tracking-[0.18em] text-ink-faint">
                  {crosses.length} Kelompok Cross Aktif
                </h3>
                <ul className="mt-4 flex flex-wrap gap-2.5">
                  {crosses.map((c) => (
                    <li key={c.id} className="card-sunk px-4 py-2.5">
                      <span className="font-serif text-base font-medium text-ink">
                        {c.name}
                      </span>
                      <span className="ml-2.5 font-mono text-xs text-ink-faint">
                        {c.meetingDay} {c.meetingTime}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>

        {/* ── 04 · Untuk pengurus (dark anchor) ─────────────────── */}
        <section className="bg-deep text-on-deep">
          <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
            <p className="kicker !text-on-deep-muted after:!bg-white/20">
              <span className="kicker-num !text-accent-on-deep">04</span> Untuk
              Pengurus
            </p>

            <h2 className="t-title mt-7 max-w-2xl text-balance text-on-deep">
              Satu tempat, supaya tidak ada yang jatuh di sela-sela
            </h2>

            <div className="mt-12 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  n: "01",
                  title: "Jadwal & penatalayan",
                  body: "Susun jadwal ibadah beserta timnya. Setiap perubahan tercatat, jadi tidak ada lagi 'katanya sudah diganti'.",
                },
                {
                  n: "02",
                  title: "Peringatan kelelahan",
                  body: "Sistem menandai anggota yang melayani lebih dari tiga kali dalam sebulan, sebelum mereka kehabisan tenaga.",
                },
                {
                  n: "03",
                  title: "Kelompok Cross",
                  body: "Daftar anggota tiap Cross, siapa pemimpinnya, dan kapan mereka bertemu.",
                },
                {
                  n: "04",
                  title: "Keuangan",
                  body: "Pemasukan dan pengeluaran per kegiatan, lengkap dengan siapa yang mencatatnya.",
                },
                {
                  n: "05",
                  title: "Notulen rapat",
                  body: "Keputusan rapat tersimpan dan bisa dicari, bukan hilang di gulungan chat.",
                },
                {
                  n: "06",
                  title: "Riwayat yang utuh",
                  body: "Data tidak pernah dihapus permanen. Kepengurusan berikutnya mewarisi ingatan, bukan folder kosong.",
                },
              ].map((f) => (
                <div key={f.n}>
                  <span className="font-mono text-[0.6875rem] tracking-[0.14em] text-accent-on-deep">
                    {f.n}
                  </span>
                  <h3 className="mt-2.5 font-serif text-xl font-semibold text-on-deep">
                    {f.title}
                  </h3>
                  <p className="mt-2 text-[0.9375rem] leading-relaxed text-on-deep-muted">
                    {f.body}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-14 border-t border-white/15 pt-8">
              <Link href="/login" className="btn btn-on-deep">
                Masuk sebagai pengurus
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-rule bg-canvas">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-5 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div className="flex items-center gap-2.5 text-ink">
            <Logomark />
            <span className="leading-tight">
              <span className="block font-serif text-base font-semibold">
                Space Youth
              </span>
              <span className="block font-mono text-[0.625rem] uppercase tracking-[0.16em] text-ink-faint">
                Komisi Pemuda GKKK Yogyakarta
              </span>
            </span>
          </div>
          <p className="font-mono text-xs text-ink-faint">
            &copy; {new Date().getFullYear()} · Dibangun untuk pelayanan
          </p>
        </div>
      </footer>
    </div>
  );
}
