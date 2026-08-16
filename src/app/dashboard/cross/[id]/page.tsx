import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCrosses, getCrossMembers, getCrossLeaders } from "@/lib/data";
import { PageHeader, BackLink, DataPoint, Monogram } from "@/components/page-parts";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const cross = (await getCrosses()).find((c) => c.id === id);
  return { title: cross ? `Cross ${cross.name}` : "Cross" };
}

export default async function CrossDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [crosses, members, leaders] = await Promise.all([
    getCrosses(),
    getCrossMembers(id),
    getCrossLeaders(id),
  ]);

  const cross = crosses.find((c) => c.id === id);
  if (!cross) notFound();

  const leaderIds = new Set(leaders.map((l) => l.id));
  const leaderLabel =
    leaders.length > 0 ? leaders.map((l) => l.nickname).join(" & ") : "Belum diklaim";

  return (
    <div className="px-5 py-7 sm:px-8 sm:py-9">
      <BackLink href="/dashboard/cross">Kembali ke Cross</BackLink>

      <div className="mt-2">
        <PageHeader
          kicker="Kelompok"
          title={cross.name}
          meta={cross.description}
        />
      </div>

      <dl className="mt-8 grid gap-x-8 gap-y-1 sm:grid-cols-3">
        <DataPoint label="Pemimpin" value={leaderLabel} />
        <DataPoint
          label="Jumlah anggota"
          value={<span className="num">{members.length} orang</span>}
        />
        <DataPoint
          label="Pertemuan"
          value={`${cross.meetingDay} ${cross.meetingTime}`}
        />
      </dl>

      {members.length > 9 && (
        <p className="mt-8 rounded-md bg-warning-wash px-4 py-3 text-sm leading-relaxed text-warning">
          Kelompok ini sudah lebih dari sembilan orang. Pertimbangkan memecahnya
          supaya pemimpin tidak kewalahan.
        </p>
      )}

      <section className="mt-10 border-t border-rule pt-6">
        <h2 className="font-mono text-[0.6875rem] uppercase tracking-[0.18em] text-ink-faint">
          Anggota Kelompok
        </h2>

        {members.length === 0 ? (
          <p className="mt-4 text-sm leading-relaxed text-ink-muted">
            Belum ada anggota yang tercatat di kelompok ini.{" "}
            {leaders.length > 0 ? (
              <>
                Pemimpinnya bisa menambahkan lewat{" "}
                <Link href="/dashboard/cross/mine" className="text-accent underline underline-offset-2">
                  Kelompokku
                </Link>
                .
              </>
            ) : (
              "Kelompok ini juga belum ada pemimpinnya — klaim dulu lewat Kelompokku sebelum bisa menambah anggota."
            )}
          </p>
        ) : (
          <ul className="mt-5 grid gap-2.5 sm:grid-cols-2">
            {members.map((member) => {
              const isLeader = leaderIds.has(member.id);
              return (
                <li key={member.id}>
                  <Link
                    href={`/dashboard/members/${member.id}`}
                    className="card-surface flex h-full items-center gap-3 p-4"
                  >
                    <Monogram name={member.nickname} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-serif text-base font-semibold text-ink">
                        {member.nickname}
                      </span>
                      <span className="block truncate text-sm text-ink-muted">
                        {member.university || "—"}
                      </span>
                    </span>
                    {isLeader && (
                      <span className="tag tag-accent shrink-0">CL</span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
