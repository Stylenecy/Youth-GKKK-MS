import type { Metadata } from "next";
import Link from "next/link";
import {
  getCrosses,
  getCrossMembers,
  getCrossLeaders,
  getMyLeaderCrossIds,
  getCurrentProfile,
  isSupabaseConfigured,
} from "@/lib/data";
import { PageHeader, EmptyState, Monogram, SectionTitle } from "@/components/page-parts";
import { ClaimCrossCard } from "@/components/ClaimCrossCard";
import { QuickAddMemberForm } from "@/components/QuickAddMemberForm";
import { ShieldCheck, Users, KeyRound } from "lucide-react";

export const metadata: Metadata = { title: "Kelompokku" };

export default async function MyCrossPage() {
  if (!isSupabaseConfigured()) {
    return (
      <div className="px-5 py-7 sm:px-8 sm:py-9">
        <PageHeader kicker="CROSS" title="Kelompokku" />
        <div className="mt-8">
          <EmptyState
            title="Belum Tersambung ke Basis Data"
            body="Halaman ini membutuhkan autentikasi Supabase untuk memverifikasi profil pemimpin yang sedang aktif. Saat ini aplikasi masih dalam mode demo."
            icon={KeyRound}
          />
        </div>
      </div>
    );
  }

  const [crosses, myLeaderCrossIds, me] = await Promise.all([
    getCrosses(),
    getMyLeaderCrossIds(),
    getCurrentProfile(),
  ]);

  const isAdmin = me?.appRole === "admin";
  const manageable = isAdmin
    ? crosses
    : crosses.filter((c) => myLeaderCrossIds.includes(c.id));
  const notPersonallyLed = crosses.filter((c) => !myLeaderCrossIds.includes(c.id));

  return (
    <div className="px-5 py-7 sm:px-8 sm:py-9">
      <PageHeader
        kicker="KEPEMIMPINAN"
        title="Kelompokku"
        meta={`${manageable.length} dari ${crosses.length} kelompok bisa kamu kelola`}
        description={
          manageable.length > 0
            ? undefined
            : "Belum ada kelompok yang kamu klaim sebagai pemimpin."
        }
      />

      {isAdmin && (
        <div className="mt-6 flex items-center gap-3 rounded-xl border border-line/60 bg-canvas-sunk p-4 text-sm text-ink">
          <ShieldCheck className="h-5 w-5 shrink-0 text-ink-faint" aria-hidden="true" />
          <span>
            <strong>Akses Administrator:</strong> Kamu memiliki izin untuk mengelola dan menambah anggota ke seluruh kelompok Cross.
          </span>
        </div>
      )}

      {manageable.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="Belum ada kelompok yang kamu kelola"
            body="Pilih dan klaim salah satu kelompok Cross di bawah menggunakan kode akses dari pengurus inti untuk mulai mendaftarkan anggota kelompokmu."
            icon={Users}
          />
        </div>
      ) : (
        <div className="mt-8 space-y-8">
          {await Promise.all(
            manageable.map(async (cross) => {
              const [members, leaders] = await Promise.all([
                getCrossMembers(cross.id),
                getCrossLeaders(cross.id),
              ]);
              const leaderIds = new Set(leaders.map((l) => l.id));
              const memberNames = members.map((m) => m.nickname);
              const iLeadThis = myLeaderCrossIds.includes(cross.id);

              return (
                <section
                  key={cross.id}
                  className="rounded-xl border border-line/60 bg-surface p-5 sm:p-6"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-rule-soft pb-4">
                    <div>
                      <h2 className="font-serif text-2xl font-normal text-ink">
                        {cross.name}
                      </h2>
                      {isAdmin && !iLeadThis && (
                        <p className="lp-meta mt-1">Dikelola lewat akses admin</p>
                      )}
                    </div>

                    <Link
                      href={`/dashboard/cross/${cross.id}`}
                      className="lp-meta inline-flex min-h-[44px] items-center gap-1 text-ink-muted hover:text-accent"
                    >
                      Rincian kelompok &rarr;
                    </Link>
                  </div>

                  {/* Inline Quick Add Form */}
                  <div className="mt-5">
                    <p className="lp-meta mb-2 font-semibold text-ink-muted">
                      <span className="lp-bracket">Tambah anggota cepat</span>
                    </p>
                    <QuickAddMemberForm
                      crossId={cross.id}
                      existingNames={memberNames}
                    />
                  </div>

                  {/* Member Grid Roster */}
                  <div className="mt-7 border-t border-rule-soft pt-5">
                    <div className="flex items-center justify-between mb-3">
                      <p className="lp-meta font-semibold text-ink-muted">
                        <span className="lp-bracket">Anggota terdaftar</span>
                      </p>
                      <span className="lp-meta">{members.length} orang</span>
                    </div>

                    {members.length === 0 ? (
                      <p className="rounded-xl border border-dashed border-rule bg-canvas-sunk/40 px-4 py-5 text-center text-xs sm:text-sm text-ink-muted">
                        Belum ada anggota tercatat. Masukkan nama panggilan di kotak input atas untuk mulai mencatat.
                      </p>
                    ) : (
                      <ul className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                        {members.map((m) => (
                          <li
                            key={m.id}
                            className="flex items-center gap-3 rounded-xl border border-line/60 bg-canvas-sunk px-3.5 py-2.5"
                          >
                            <Monogram name={m.nickname} size="sm" />
                            <span className="truncate text-sm font-medium text-ink">
                              {m.nickname}
                            </span>
                            {leaderIds.has(m.id) && (
                              <span className="tag tag-accent ml-auto shrink-0 text-[0.625rem] font-bold">
                                CL
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </section>
              );
            })
          )}
        </div>
      )}

      {/* Claim Available Crosses */}
      {notPersonallyLed.length > 0 && (
        <div className="mt-12 border-t border-rule-soft pt-8">
          <SectionTitle
            title={isAdmin ? "Klaim kepemimpinan resmi" : "Pilih kelompok yang kamu pimpin"}
          />
          <p className="mt-2 text-xs sm:text-sm leading-relaxed text-ink-muted max-w-2xl">
            {isAdmin
              ? "Kamu sudah dapat mengelola seluruh kelompok melalui akses admin. Masukkan kode akses di sini jika kamu merupakan pemimpin resmi salah satunya agar namamu terdaftar sebagai CL."
              : "Jika kamu memimpin salah satu kelompok di bawah ini, masukkan kode akses dari pengurus inti untuk mengklaim peran sebagai pemimpin kelompok (CL)."}
          </p>

          <ul className="mt-5 grid gap-4 sm:grid-cols-2">
            {notPersonallyLed.map((cross) => (
              <ClaimCrossCard key={cross.id} cross={cross} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
