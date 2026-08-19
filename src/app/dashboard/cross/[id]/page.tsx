import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCrosses, getCrossMembers, getCrossLeaders } from "@/lib/data";
import { PageHeader, BackLink, DataPoint, Monogram } from "@/components/page-parts";
import { Users, AlertTriangle, Clock, ArrowRight } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const cross = (await getCrosses()).find((c) => c.id === id);
  return { title: cross ? `Cross ${cross.name}` : "Detail Cross" };
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
      <BackLink href="/dashboard/cross">Kembali ke daftar Cross</BackLink>

      <div className="mt-3">
        <PageHeader
          kicker="KELOMPOK SEL"
          title={cross.name}
          meta={cross.description}
          action={
            <Link
              href="/dashboard/cross/mine"
              className="btn-primary text-xs sm:text-sm shadow-[0_0_16px_rgba(253,190,2,0.25)]"
            >
              <Users className="h-4 w-4" aria-hidden="true" />
              Kelola di Kelompokku
            </Link>
          }
        />
      </div>

      {/* Metadata Shelf */}
      <div className="mt-8 rounded-2xl border border-line/40 bg-surface/75 p-6 backdrop-blur-xl shadow-sm">
        <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-3">
          <DataPoint label="Pemimpin Kelompok (CL)" value={leaderLabel} />
          <DataPoint
            label="Jumlah Anggota Terdaftar"
            value={<span className="num text-accent font-bold">{members.length} Orang</span>}
          />
          <DataPoint
            label="Jadwal & Waktu Pertemuan"
            value={`${cross.meetingDay} pukul ${cross.meetingTime}`}
          />
        </dl>
      </div>

      {/* Warning if group capacity > 9 */}
      {members.length > 9 && (
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-warning/40 bg-warning-wash/60 p-4.5 text-sm text-warning backdrop-blur-xl">
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <p className="font-bold">Kapasitas Kelompok Lebih dari 9 Orang</p>
            <p className="mt-1 text-xs text-ink-muted leading-relaxed">
              Kelompok Cross ini sudah cukup besar ({members.length} orang). Pertimbangkan untuk memekarkan kelompok atau menunjuk co-leader baru agar pembinaan tetap intim dan intensif.
            </p>
          </div>
        </div>
      )}

      {/* Member Roster Section */}
      <section className="mt-10 border-t border-rule-soft pt-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            <h2 className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-accent">
              ( ANGGOTA KELOMPOK — {members.length} ORANG )
            </h2>
          </div>
        </div>

        {members.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-rule bg-canvas-sunk/40 px-6 py-10 text-center">
            <p className="text-sm leading-relaxed text-ink-muted max-w-md mx-auto">
              Belum ada anggota yang tercatat di kelompok ini.{" "}
              {leaders.length > 0 ? (
                <>
                  Pemimpinnya dapat menambahkan lewat menu{" "}
                  <Link href="/dashboard/cross/mine" className="text-accent underline underline-offset-2 font-medium">
                    Kelompokku
                  </Link>
                  .
                </>
              ) : (
                "Kelompok ini juga belum ada pemimpinnya — silakan klaim dulu lewat Kelompokku sebelum mendaftarkan anggota."
              )}
            </p>
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {members.map((member) => {
              const isLeader = leaderIds.has(member.id);
              return (
                <li key={member.id}>
                  <Link
                    href={`/dashboard/members/${member.id}`}
                    className="group flex h-full items-center gap-3.5 rounded-2xl border border-line/40 bg-surface/75 p-4 backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-accent hover:bg-surface hover:shadow-md"
                  >
                    <Monogram name={member.nickname} size="md" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-serif text-base font-bold text-ink group-hover:text-accent transition-colors">
                        {member.nickname}
                      </p>
                      <p className="truncate text-xs text-ink-muted mt-0.5">
                        {member.university || "Jemaat Youth"}
                      </p>
                    </div>
                    {isLeader && (
                      <span className="tag tag-accent shrink-0 text-[0.625rem] font-bold">
                        CL
                      </span>
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
