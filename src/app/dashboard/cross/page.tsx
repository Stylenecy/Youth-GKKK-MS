import Link from "next/link";
import type { Metadata } from "next";
import { getCrosses, getCrossMemberCounts, getAllCrossLeaderNicknames } from "@/lib/data";
import { PageHeader, EmptyState } from "@/components/page-parts";

export const metadata: Metadata = { title: "Cross" };

export default async function CrossPage() {
  const [crosses, counts, leaderNicknames] = await Promise.all([
    getCrosses(),
    getCrossMemberCounts(),
    getAllCrossLeaderNicknames(),
  ]);

  // Counted from the membership table, not the stored memberCount column —
  // that column drifts as soon as anyone joins or leaves.
  const totalMembers = crosses.reduce((a, c) => a + (counts[c.id] ?? 0), 0);

  return (
    <div className="px-5 py-7 sm:px-8 sm:py-9">
      <PageHeader
        kicker="Kelompok"
        title="Cross"
        meta={`${crosses.length} kelompok aktif · ${totalMembers} anggota`}
      />

      {crosses.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="Belum ada kelompok Cross"
            body="Kelompok yang sudah dibentuk akan muncul di sini beserta pemimpin dan jadwal pertemuannya."
          />
        </div>
      ) : (
        <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {crosses.map((cross) => {
            const leaders = leaderNicknames[cross.id] ?? [];
            return (
              <li key={cross.id}>
                <Link
                  href={`/dashboard/cross/${cross.id}`}
                  className="card-surface flex h-full flex-col p-5"
                >
                  <span className="font-mono text-[0.625rem] uppercase tracking-[0.14em] text-accent">
                    {counts[cross.id] ?? 0} anggota
                  </span>
                  <span className="mt-1.5 font-serif text-xl font-semibold text-ink">
                    {cross.name}
                  </span>
                  <span className="mt-2 flex-1 text-sm leading-relaxed text-ink-muted">
                    {cross.description}
                  </span>
                  <span className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-rule-soft pt-3 font-mono text-[0.625rem] uppercase tracking-[0.12em] text-ink-faint">
                    <span>
                      Pemimpin{" "}
                      {leaders.length > 0 ? leaders.join(" & ") : "Belum diklaim"}
                    </span>
                    <span>
                      {cross.meetingDay} {cross.meetingTime}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
