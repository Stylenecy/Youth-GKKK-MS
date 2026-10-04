import Link from "next/link";
import type { CSSProperties } from "react";
import SectionHead from "./SectionHead";
import { Logomark } from "@/components/Masthead";
import type { BulletinEvent, CrossSlot, PublicBulletin } from "@/lib/bulletin";
import { slotsFilled } from "@/lib/bulletin";
import {
  eventTypeLabel,
  formatDayNumber,
  formatMonthShort,
  formatShortDate,
  formatTime,
  formatWeekdayDayMonth,
} from "@/lib/datetime";

/* ------------------------------------------------------------------ */
/* Makna — the two halves of the mark, said once, large.               */
/* ------------------------------------------------------------------ */

export function Makna() {
  const rows = [
    {
      key: "Api",
      tone: "text-accent",
      lead: "Semangat yang",
      accent: "membara",
      tail: "untuk memuliakan Tuhan.",
    },
    {
      key: "Wadah",
      tone: "text-rose",
      lead: "Tempat bertumbuh",
      accent: "bersama",
      tail: "sebagai satu kesatuan.",
    },
  ];
  return (
    <section aria-label="Makna lambang" className="relative py-24 sm:py-28 lg:py-36">
      <div className="lp-wrap">
        <div className="grid gap-20 lg:gap-28">
          {rows.map((r, i) => (
            <div key={r.key} className="grid gap-6 lg:grid-cols-12 lg:gap-6">
              <div className="lg:col-span-3" data-reveal="fade">
                <p className={`lp-meta ${r.tone}`}>
                  <span className="lp-bracket">0{i + 1}</span>&nbsp;&nbsp;{r.key}
                </p>
                <span className="lp-rule mt-4 max-w-[12rem]" data-reveal="rule" />
              </div>
              <p className="lp-display text-ink lg:col-span-9" data-reveal="lines">
                {r.lead} <em className="lp-italic">{r.accent}</em> {r.tail}
              </p>
            </div>
          ))}
        </div>
        <p className="lp-meta mt-16 lg:mt-24 lg:pl-[25%]" data-reveal="fade">
          Dari filosofi lambang Youth GKKK.
        </p>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 01 Warta                                                            */
/* ------------------------------------------------------------------ */

function Shelf({ items }: { items: { k: string; v: string; gold?: boolean }[] }) {
  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-6 border-y border-rule py-6 sm:grid-cols-3" data-reveal="fade">
      {items.map((it) => (
        <div key={it.k}>
          <dt className="lp-meta lp-bracket">{it.k}</dt>
          <dd className={`mt-2 font-serif text-lg leading-snug ${it.gold ? "text-accent" : "text-ink"}`}>
            {it.v}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function Warta({
  event,
  latest,
  daysLabel,
  targetLabel,
  updatedLabel,
  unavailable = false,
}: {
  event: BulletinEvent | null;
  latest: PublicBulletin["latest"];
  daysLabel: string;
  targetLabel: string;
  updatedLabel: string;
  /** The bulletin could not be loaded — say so instead of "being prepared". */
  unavailable?: boolean;
}) {
  const slots = event ? slotsFilled(event.roles) : null;
  const published = event?.status === "published";

  return (
    <section id="warta" className="relative scroll-mt-16 pb-24 pt-12 sm:pb-32 sm:pt-16 lg:pb-40 lg:pt-20">
      <div className="lp-wrap">
        <SectionHead n="01" label="Warta" right={updatedLabel} />

        <div className="mt-14 grid gap-14 lg:mt-20 lg:grid-cols-12 lg:gap-6">
          <div className="lg:col-span-4">
            <p className="lp-meta" data-reveal="fade">
              Menuju pertemuan berikutnya
            </p>
            <p
              className="lp-num mt-4 text-[clamp(5.5rem,3rem+9vw,11rem)] text-accent"
              data-reveal="clip"
            >
              {daysLabel}
            </p>
            <p className="lp-meta mt-5 text-ink-muted" data-reveal="fade">
              {targetLabel}
            </p>
          </div>

          <div className="lg:col-span-8">
            {event ? (
              <>
                <div className="flex flex-wrap items-center gap-2.5" data-reveal="fade">
                  <span className="tag">{eventTypeLabel(event.type)}</span>
                  <span className={published ? "tag tag-sage" : "tag"}>
                    {published ? "Terjadwal" : "Rencana"}
                  </span>
                </div>
                <h2 className="lp-display mt-6 text-balance text-ink" data-reveal="lines">
                  {event.theme}
                </h2>
                {published && event.description ? (
                  <p className="lp-lead mt-6" data-reveal="fade">
                    {event.description}
                  </p>
                ) : null}

                <div className="mt-10">
                  <Shelf
                    items={[
                      { k: "Tanggal", v: formatWeekdayDayMonth(event.date) },
                      { k: "Waktu", v: formatTime(event.date), gold: true },
                      { k: "Tempat", v: "Ruang Hermon" },
                    ]}
                  />
                </div>

                {slots ? (
                  <div className="mt-8 max-w-md" data-reveal="fade">
                    <div className="flex items-baseline justify-between gap-4">
                      <p className="lp-meta">Penatalayan</p>
                      <p className="lp-meta text-ink">
                        <span className="text-accent">{slots.filled}</span>/{slots.needed} slot terisi
                      </p>
                    </div>
                    <div className="lp-meter mt-3" role="img" aria-label={`${slots.filled} dari ${slots.needed} slot penatalayan terisi`}>
                      <span
                        className="meter-fill"
                        data-reveal="meter"
                        style={{ transform: `scaleX(${slots.filled / slots.needed})` } as CSSProperties}
                      />
                    </div>
                  </div>
                ) : null}
              </>
            ) : unavailable ? (
              <>
                <h2 className="lp-display text-balance text-ink" data-reveal="lines">
                  Warta belum bisa <em className="lp-italic">dimuat</em>.
                </h2>
                <p className="lp-lead mt-6" data-reveal="fade">
                  Coba buka lagi sebentar. Irama mingguannya tetap: Sabtu pukul 17.00 di Ruang
                  Hermon.
                </p>
              </>
            ) : (
              <>
                <h2 className="lp-display text-balance text-ink" data-reveal="lines">
                  Tema Sabtu ini <em className="lp-italic">sedang disiapkan</em> pengurus.
                </h2>
                <p className="lp-lead mt-6" data-reveal="fade">
                  Tema dan jadwalnya muncul di sini begitu pengurus memasukkannya. Irama
                  mingguannya tetap: Sabtu pukul 17.00 di Ruang Hermon.
                </p>
                {latest ? (
                  <div className="mt-10" data-reveal="fade">
                    <p className="lp-meta lp-bracket">Pertemuan terakhir</p>
                    <div className="mt-3 flex flex-col gap-1 border-t border-rule pt-4 sm:flex-row sm:items-baseline sm:gap-6">
                      <span className="lp-meta shrink-0 text-ink-muted">
                        {formatShortDate(latest.date)} · {eventTypeLabel(latest.type)}
                      </span>
                      <span className="font-serif text-xl leading-snug text-ink">{latest.theme}</span>
                    </div>
                  </div>
                ) : null}
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 02 Ritme — the page's one pinned sequence (desktop only).           */
/* ------------------------------------------------------------------ */

const hhmm = (t: string | null) => (t ? t.replace(":", ".") : null);

/** The week, step by step. The Cross step reads its time from the data when
 *  every group shares one slot; otherwise it says the groups decide. */
function rhythm(cross: CrossSlot | null) {
  return [
    { day: "Rabu", time: "19.00", title: "Latihan awal", note: "Tim WL dan singer bersama pemusik menyiapkan lagu untuk Sabtu." },
    { day: "Sabtu", time: "15.00", title: "Latihan akhir", note: "Gladi bersih bersama tim Multimedia di Ruang Hermon." },
    { day: "Sabtu", time: "17.00", title: "Ibadah Pemuda", note: "Persekutuan seluruh Pemuda di Ruang Hermon. Pusat minggu kami.", highlight: true },
    cross?.day && cross.time
      ? { day: cross.day, time: hhmm(cross.time)!, title: "Cross", note: "Kelompok kecil Pemuda bertemu untuk menggali firman dan saling mendoakan." }
      : { day: "Fleksibel", time: "Cross", title: "Kelompok kecil", note: "Bertumbuh bersama dalam kelompok Cross, di hari yang disepakati tiap kelompok." },
  ];
}

export function Ritme({ cross = null }: { cross?: CrossSlot | null }) {
  const RHYTHM = rhythm(cross);
  return (
    <section id="ritme" className="relative scroll-mt-16" data-ritme>
      <div className="lp-wrap lp-ritme-stage pb-24 pt-24 sm:pb-32 sm:pt-32" data-ritme-stage>
        <SectionHead n="02" label="Ritme" right="Tiap minggu" />

        <div className="mt-12 overflow-visible lg:mt-14">
          <div className="lp-ritme-track" data-ritme-track>
            <div className="lp-ritme-panel pb-12 lg:pr-16">
              <h2 className="lp-display text-ink" data-reveal="lines">
                Seminggu, <em className="lp-italic">satu irama</em>.
              </h2>
              <p className="lp-lead mt-6 max-w-sm" data-reveal="fade">
                Pelayanan itu irama, bukan sekadar acara. Ini alur yang kami jalani bersama setiap
                minggu.
              </p>
              <p className="lp-meta lp-ritme-hint mt-8">Gulir untuk mengikuti minggunya &rarr;</p>
            </div>

            {RHYTHM.map((r, i) => (
              <article
                key={r.title}
                className="lp-ritme-panel border-t border-rule py-8 lg:border-l lg:border-t-0 lg:px-10 lg:py-2"
                data-reveal="fade"
              >
                <p className="lp-meta">
                  <span className={r.highlight ? "text-accent" : ""}>0{i + 1}</span>&nbsp;/ 04&nbsp;&nbsp;·&nbsp;&nbsp;{r.day}
                </p>
                <p
                  className={`lp-num mt-6 text-[clamp(4rem,2.4rem+5vw,7.5rem)] ${r.highlight ? "text-accent" : "text-ink"}`}
                >
                  {r.time}
                </p>
                <h3 className="lp-title mt-6 text-ink">{r.title}</h3>
                <p className="mt-3 max-w-xs text-[0.9375rem] leading-relaxed text-ink-muted">{r.note}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="lp-ritme-progress mt-12" aria-hidden="true">
          <div className="lp-meter">
            <span className="bg-accent" data-ritme-progress style={{ transform: "scaleX(0)" }} />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 03 Agenda + 04 Cross                                                */
/* ------------------------------------------------------------------ */

export function Agenda({ events }: { events: BulletinEvent[] }) {
  return (
    <section id="agenda" className="relative scroll-mt-16 py-24 sm:py-32 lg:py-40">
      <div className="lp-wrap">
        <SectionHead n="03" label="Agenda" right={`${events.length} terjadwal`} />
        <div className="mt-12 grid gap-10 lg:mt-16 lg:grid-cols-12 lg:gap-6">
          <h2 className="lp-display text-ink lg:col-span-5" data-reveal="lines">
            Yang <em className="lp-italic">akan datang</em>.
          </h2>
          <div className="lg:col-span-7">
            {events.length > 0 ? (
              <ul>
                {events.map((e) => {
                  const published = e.status === "published";
                  return (
                    <li
                      key={e.date + e.theme}
                      className="grid grid-cols-[4.5rem_1fr] items-baseline gap-x-5 gap-y-2 border-b border-rule py-6 sm:grid-cols-[5.5rem_1fr_auto]"
                      data-reveal="fade"
                    >
                      <div className="row-span-2 sm:row-span-1">
                        <span className="lp-title block text-ink">{formatDayNumber(e.date)}</span>
                        <span className="lp-meta mt-1 block">{formatMonthShort(e.date)}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-serif text-xl leading-snug text-ink">{e.theme}</p>
                        <p className="lp-meta mt-2">
                          {eventTypeLabel(e.type)} · {formatTime(e.date)}
                        </p>
                      </div>
                      <span className={`${published ? "tag tag-sage" : "tag"} justify-self-start sm:justify-self-end`}>
                        {published ? "Terjadwal" : "Rencana"}
                      </span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="border-y border-rule py-8" data-reveal="fade">
                <p className="font-serif text-xl leading-snug text-ink">
                  Belum ada agenda lain yang dijadwalkan.
                </p>
                <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-muted">
                  Retreat, talkshow, atau acara spesial akan tampil di sini setelah pengurus
                  memasukkannya ke jadwal.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export function CrossGroups({ count, schedule }: { count: number; schedule: CrossSlot[] }) {
  // Always rendered: the nav and footer link to #cross.
  return (
    <section id="cross" className="relative scroll-mt-16 py-24 sm:py-32 lg:py-40">
      <div className="lp-wrap">
        <SectionHead n="04" label="Cross" right="Kelompok kecil" />
        <div className="mt-12 grid gap-12 lg:mt-16 lg:grid-cols-12 lg:gap-6">
          <div className="lg:col-span-5">
            <p className="lp-num text-[clamp(6rem,3rem+10vw,12rem)] text-ink" data-reveal="clip">
              {String(count).padStart(2, "0")}
            </p>
            <h2 className="lp-title mt-6 text-ink" data-reveal="lines">
              Kelompok, <em className="lp-italic">satu tubuh</em>.
            </h2>
          </div>
          <div className="lg:col-span-7">
            <p className="lp-lead" data-reveal="fade">
              Di Cross, Pemuda bertemu dalam kelompok kecil untuk menggali firman dan saling
              mendoakan. Tiap kelompok dipimpin oleh pemimpin Cross yang ditunjuk pengurus.
            </p>
            {schedule.length > 0 ? (
              <dl className="mt-10">
                {schedule.map((s) => (
                  <div
                    key={`${s.day}-${s.time}`}
                    className="flex items-baseline justify-between gap-6 border-b border-rule py-5 first:border-t"
                    data-reveal="fade"
                  >
                    <dt className="font-serif text-2xl text-ink">
                      {[s.day, hhmm(s.time)].filter(Boolean).join(" · ") || "Jadwal disepakati kelompok"}
                    </dt>
                    <dd className="lp-meta shrink-0">
                      <span className="text-accent">{s.groups}</span> kelompok
                    </dd>
                  </div>
                ))}
              </dl>
            ) : null}
            <p className="lp-meta mt-8 max-w-md" data-reveal="fade">
              Ingin ikut Cross? Sampaikan ke pengurus Pemuda selepas ibadah Sabtu.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
/* ------------------------------------------------------------------ */
/* 05 Angka — numbers as the stage. Real counts, no names.             */
/* ------------------------------------------------------------------ */

export function Angka({ counts, demo }: { counts: PublicBulletin["counts"]; demo: boolean }) {
  const items = [
    { v: counts.events, label: "ibadah & acara tercatat" },
    { v: counts.assignments, label: "tugas penatalayan dijadwalkan" },
    { v: counts.members, label: "anggota aktif terdata" },
    { v: counts.crosses, label: "kelompok Cross aktif" },
  ];
  if (items.every((i) => i.v === 0)) return null;
  return (
    <section aria-labelledby="angka-title" className="relative py-24 sm:py-32 lg:py-40">
      <div className="lp-wrap">
        <SectionHead
          n="05"
          label="Angka"
          right={demo ? "Data contoh (mode demo)" : "Langsung dari basis data"}
        />
        <h2 id="angka-title" className="lp-display mt-12 max-w-4xl text-ink lg:mt-16" data-reveal="lines">
          Dicatat, <em className="lp-italic">bukan diingat-ingat</em>.
        </h2>
        <dl className="mt-14 grid grid-cols-2 gap-x-6 gap-y-12 lg:mt-20 lg:grid-cols-4">
          {items.map((it) => (
            <div key={it.label} className="lp-hud flex flex-col-reverse px-4 pb-5 pt-6" data-reveal="fade">
              {/* dt first for screen readers ("anggota aktif: 93"); shown under the number. */}
              <dt className="lp-meta mt-4 min-h-[2.9em]">{it.label}</dt>
              <dd className="lp-num text-[clamp(3.25rem,2rem+4vw,6.5rem)] text-ink">
                <span data-count={it.v}>{it.v}</span>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 06 Pengurus — what the workspace does, honestly.                    */
/* ------------------------------------------------------------------ */

const TOOLS = [
  {
    name: "Penatalayan",
    body: "Papan per Sabtu: siapa melayani di peran apa, slot yang masih kurang, dan tanda bila seseorang sudah melayani lebih dari 2× dalam 30 hari.",
  },
  { name: "Absensi", body: "Kehadiran tiap ibadah dicatat langsung dari HP, tersimpan per anggota." },
  { name: "Kas", body: "Buku kas Pemuda untuk bendahara dan admin, bisa diekspor ke spreadsheet." },
  { name: "Anggota & Cross", body: "Direktori anggota dan kelompok Cross, lengkap dengan pemimpin tiap kelompok." },
];

export function Pengurus() {
  return (
    <section id="pengurus" aria-labelledby="pengurus-title" className="relative scroll-mt-16 py-24 sm:py-32 lg:py-40">
      <div className="lp-wrap">
        <SectionHead n="06" label="Pengurus" right="Akses dengan persetujuan" />
        <div className="mt-12 grid gap-12 lg:mt-16 lg:grid-cols-12 lg:gap-6">
          <div className="lg:col-span-5">
            <h2 id="pengurus-title" className="lp-display text-ink" data-reveal="lines">
              Ruang kerja <em className="lp-italic">pengurus</em>.
            </h2>
            <p className="lp-lead mt-6 max-w-sm" data-reveal="fade">
              Jadwal, petugas, kehadiran, dan kas Pemuda di satu tempat, supaya tidak tercecer di
              banyak grup chat.
            </p>
            <div className="mt-8" data-reveal="fade">
              <Link href="/login" className="lp-btn lp-btn-primary" data-magnetic>
                Masuk dengan akun Google
                <span aria-hidden="true" className="lp-arrow">
                  &rarr;
                </span>
              </Link>
              <p className="lp-meta mt-4 max-w-xs">Akun baru aktif setelah disetujui admin Pemuda.</p>
            </div>
          </div>
          <ol className="lg:col-span-7">
            {TOOLS.map((t, i) => (
              <li key={t.name} className="grid grid-cols-[3rem_1fr] gap-x-4 border-b border-rule py-7 first:border-t" data-reveal="fade">
                <span className="lp-meta pt-2 text-accent">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <h3 className="lp-title text-[clamp(1.5rem,1.1rem+1.4vw,2.25rem)] text-ink">{t.name}</h3>
                  <p className="mt-2 max-w-lg text-[0.9375rem] leading-relaxed text-ink-muted">{t.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Penutup — the vessel colour, once. Then the footer.                 */
/* ------------------------------------------------------------------ */

export function Closing({ nextLabel, timeLabel }: { nextLabel: string; timeLabel: string }) {
  const year = new Date().getFullYear();
  return (
    <footer className="relative overflow-hidden bg-deep text-on-deep" data-closing>
      <div className="lp-wrap pb-10 pt-24 sm:pt-32 lg:pt-40">
        <p className="lp-meta text-on-deep-muted" data-reveal="fade">
          <span className="text-accent-on-deep">07</span>&nbsp;&nbsp;<span className="lp-bracket">Sampai jumpa</span>
        </p>
        <p className="lp-mega mt-8 text-on-deep" data-reveal="lines">
          Sampai jumpa <em className="lp-italic text-accent-on-deep">Sabtu</em>.
        </p>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:mt-14 lg:grid-cols-12" data-reveal="fade">
          <p className="lp-meta text-on-deep-muted lg:col-span-4">
            {nextLabel} · {timeLabel}
            <br />
            Ruang Hermon, GKKK Jogja
          </p>
          <div className="flex flex-wrap gap-3 sm:justify-end lg:col-span-8">
            <a href="#warta" className="lp-btn border-on-deep-muted/55 text-on-deep hover:border-accent-on-deep hover:text-accent-on-deep" data-magnetic>
              Kembali ke warta
            </a>
            <Link href="/login" className="lp-btn lp-btn-primary" data-magnetic>
              Masuk pengurus
            </Link>
          </div>
        </div>

        <div className="mt-20 flex flex-col gap-6 border-t border-on-deep-muted/25 pt-8 sm:flex-row sm:items-center sm:justify-between lg:mt-28">
          <div className="flex items-center gap-3">
            <Logomark className="h-9 w-9" />
            <span className="leading-tight">
              <span className="block font-serif text-lg">Youth GKKK</span>
              <span className="lp-meta block text-on-deep-muted">Komisi Pemuda GKKK Jogja</span>
            </span>
          </div>
          <nav aria-label="Tautan bawah" className="flex flex-wrap gap-x-6">
            {[
              ["#warta", "Warta"],
              ["#ritme", "Ritme"],
              ["#agenda", "Agenda"],
              ["#cross", "Cross"],
            ].map(([href, label]) => (
              <a key={href} href={href} className="lp-link lp-meta text-on-deep-muted hover:text-on-deep">
                {label}
              </a>
            ))}
          </nav>
          <p className="lp-meta text-on-deep-muted">© {year} Komisi Pemuda GKKK Jogja</p>
        </div>
      </div>
    </footer>
  );
}
