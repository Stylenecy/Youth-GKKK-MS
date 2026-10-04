import Link from "next/link";
import type { Metadata } from "next";
import { getCrosses, getCrossMemberCounts, getAllCrossLeaderNicknames } from "@/lib/data";
import { PageHeader, EmptyState, SectionTitle } from "@/components/page-parts";
import { Network, Users, ChevronRight } from "lucide-react";
import { formatClock } from "@/lib/datetime";

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
            className="btn-primary text-xs sm:text-sm"
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
          <div className="mb-4">
            <SectionTitle title="Daftar sel pemuridan" meta={<>{crosses.length} kelompok</>} />
          </div>

          {/* A ruled list, not a wall of equal cards: five groups read
              faster as rows (name, leaders, size, schedule) and nothing
              lifts or glows on hover. */}
          <ul className="divide-y divide-rule-soft overflow-hidden rounded-xl border border-line/60 bg-surface">
            {crosses.map((cross, idx) => {
              const leaders = leaderNicknames[cross.id] ?? [];
              const memberCount = counts[cross.id] ?? 0;
              return (
                <li key={cross.id}>
                  <Link
                    href={`/dashboard/cross/${cross.id}`}
                    className="group flex items-start gap-4 px-4 py-4 transition-colors duration-200 hover:bg-surface-2 sm:items-center sm:gap-6 sm:px-5"
                  >
                    <span className="lp-num mt-1 w-8 shrink-0 text-lg text-ink-faint sm:mt-0" aria-hidden="true">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-serif text-lg font-normal leading-tight text-ink transition-colors group-hover:text-accent">
                        {cross.name}
                      </span>
                      {cross.description && (
                        <span className="mt-1 block text-sm leading-relaxed text-ink-muted line-clamp-2">
                          {cross.description}
                        </span>
                      )}
                      <span className="lp-meta mt-2 flex flex-wrap gap-x-4 gap-y-1">
                        <span className="whitespace-nowrap">
                          CL · <span className="text-ink-muted">{leaders.length > 0 ? leaders.join(" & ") : "Belum diklaim"}</span>
                        </span>
                        <span className="whitespace-nowrap">{memberCount} anggota</span>
                        {cross.meetingDay && (
                          <span className="whitespace-nowrap">
                            {cross.meetingDay} {formatClock(cross.meetingTime)}
                          </span>
                        )}
                      </span>
                    </span>
                    <ChevronRight
                      className="mt-1 h-4 w-4 shrink-0 text-ink-faint transition-colors group-hover:text-accent sm:mt-0"
                      aria-hidden="true"
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
