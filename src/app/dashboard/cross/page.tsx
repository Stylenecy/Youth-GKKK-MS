import Link from "next/link";
import type { Metadata } from "next";
import { getCrosses, getCrossMemberCounts, getAllCrossLeaderNicknames } from "@/lib/data";
import { PageHeader, EmptyState } from "@/components/page-parts";
import { Network, Users, Clock, ChevronRight } from "lucide-react";

export const metadata: Metadata = { title: "Kelompok Cross" };

export default async function CrossPage() {
  const [crosses, counts, leaderNicknames] = await Promise.all([
    getCrosses(),
    getCrossMemberCounts(),
    getAllCrossLeaderNicknames(),
  ]);

  const totalMembers = crosses.reduce((a, c) => a + (counts[c.id] ?? 0), 0);

  return (
    <div className="px-5 py-7 sm:px-8 sm:py-9">
      <PageHeader
        kicker="KOMUNITAS SEL"
        title="Kelompok Pemuridan Cross"
        meta={`${crosses.length} kelompok aktif · ${totalMembers} total anggota terdaftar`}
        action={
          <Link
            href="/dashboard/cross/mine"
            className="btn-primary text-xs sm:text-sm shadow-[0_0_16px_rgba(253,190,2,0.25)]"
          >
            <Users className="h-4 w-4" aria-hidden="true" />
            Kelola Kelompokku
          </Link>
        }
      />

      {crosses.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="Belum ada kelompok Cross"
            body="Kelompok yang sudah dibentuk akan muncul di sini beserta pemimpin dan jadwal pertemuannya."
            icon={Network}
          />
        </div>
      ) : (
        <div className="mt-8">
          <div className="flex items-center justify-between border-b border-rule-soft pb-3 mb-6">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              <h2 className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-accent">
                ( DAFTAR SEL PEMURIDAN )
              </h2>
            </div>
            <span className="font-mono text-xs text-ink-faint">
              {crosses.length} Kelompok
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {crosses.map((cross, idx) => {
              const leaders = leaderNicknames[cross.id] ?? [];
              const memberCount = counts[cross.id] ?? 0;
              return (
                <div key={cross.id} className="group">
                  <Link
                    href={`/dashboard/cross/${cross.id}`}
                    className="relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-line/40 bg-surface/75 p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-accent hover:bg-surface hover:shadow-[0_16px_40px_rgba(253,190,2,0.18)] min-h-[260px]"
                  >
                    {/* Top Accent Rim */}
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent to-transparent opacity-40 group-hover:opacity-100 transition-opacity"
                    />

                    {/* Shimmering vertical light ray */}
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-24 h-full bg-gradient-to-b from-accent/10 via-transparent to-transparent blur-lg opacity-40 group-hover:opacity-80 transition-opacity"
                    />

                    {/* Top Row: Tag & Index */}
                    <div className="relative z-10 flex items-center justify-between">
                      <div className="inline-flex items-center gap-1.5 rounded-full border border-line-accent/50 bg-accent-wash/70 px-3 py-1 text-xs font-mono font-bold uppercase text-accent">
                        <Users className="h-3 w-3" />
                        <span>{memberCount} Anggota</span>
                      </div>
                      <span className="font-mono text-xs font-bold text-ink-faint group-hover:text-accent transition-colors">
                        ( 0{idx + 1} )
                      </span>
                    </div>

                    {/* Middle: Name & Description */}
                    <div className="relative z-10 my-4 flex-1">
                      <h3 className="font-serif text-xl font-bold text-ink group-hover:text-accent transition-colors leading-tight">
                        {cross.name}
                      </h3>
                      <p className="mt-2 text-xs leading-relaxed text-ink-muted line-clamp-3">
                        {cross.description}
                      </p>
                    </div>

                    {/* Bottom Metadata Shelf */}
                    <div className="relative z-10 border-t border-rule-soft pt-3.5 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                      <div className="text-ink-muted">
                        <span className="text-ink-faint">CL: </span>
                        <span className="font-semibold text-ink">
                          {leaders.length > 0 ? leaders.join(" & ") : "Belum diklaim"}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 text-accent">
                        <Clock className="h-3 w-3" />
                        <span>{cross.meetingDay} {cross.meetingTime}</span>
                      </div>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
