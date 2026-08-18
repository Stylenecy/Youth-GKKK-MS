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
import { PageHeader, EmptyState, Monogram } from "@/components/page-parts";
import { ClaimCrossCard } from "@/components/ClaimCrossCard";
import { QuickAddMemberForm } from "@/components/QuickAddMemberForm";
import { ShieldCheck } from "lucide-react";

export const metadata: Metadata = { title: "Kelompokku" };

export default async function MyCrossPage() {
  if (!isSupabaseConfigured()) {
    return (
      <div className="px-5 py-7 sm:px-8 sm:py-9">
        <PageHeader kicker="Cross" title="Kelompokku" />
        <div className="mt-8">
          <EmptyState
            title="Belum bisa login sungguhan"
            body="Halaman ini butuh Supabase tersambung supaya tahu siapa yang sedang masuk. Sekarang situs masih mode demo — buka Pengaturan untuk status lengkapnya."
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
  // Admins can manage every group (enforced by add_cross_member() in SQL,
  // mirrored here so the UI doesn't hide a button the backend would
  // actually allow). Being an admin is separate from personally leading a
  // group — Dex can still claim "Cross Dex" as his own, on top of that.
  const manageable = isAdmin
    ? crosses
    : crosses.filter((c) => myLeaderCrossIds.includes(c.id));
  const notPersonallyLed = crosses.filter((c) => !myLeaderCrossIds.includes(c.id));

  return (
    <div className="px-5 py-7 sm:px-8 sm:py-9">
      <PageHeader
        kicker="Cross"
        title="Kelompokku"
        meta={
          manageable.length > 0
            ? `Kamu bisa mengelola ${manageable.length} dari ${crosses.length} kelompok`
            : "Belum ada kelompok yang kamu klaim"
        }
      />

      {isAdmin && (
        <p className="mt-4 flex items-center gap-2 rounded-md bg-accent-wash px-3.5 py-2.5 text-sm text-accent">
          <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
          Kamu admin — bisa menambah anggota ke kelompok mana pun, bukan cuma
          yang kamu pimpin.
        </p>
      )}

      {manageable.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="Belum ada kelompok yang bisa kamu kelola"
            body="Klaim salah satu kelompok Cross di bawah untuk mulai menambah anggotanya. Kalau kamu bukan pemimpin satu pun kelompok ini, minta pengurus menambahkanmu."
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
                <section key={cross.id} className="card-surface p-5 sm:p-6">
                  <div className="flex items-baseline justify-between gap-3">
                    <h2 className="font-serif text-xl font-semibold text-ink">
                      {cross.name}
                    </h2>
                    <Link
                      href={`/dashboard/cross/${cross.id}`}
                      className="shrink-0 font-mono text-[0.625rem] uppercase tracking-[0.12em] text-ink-faint transition-colors hover:text-ink"
                    >
                      Lihat detail
                    </Link>
                  </div>

                  {isAdmin && !iLeadThis && (
                    <p className="mt-1.5 text-xs text-ink-faint">
                      Kamu mengelola ini lewat akses admin — belum jadi
                      pemimpin resmi kelompok ini.
                    </p>
                  )}

                  <p className="mt-4 font-mono text-[0.625rem] uppercase tracking-[0.16em] text-ink-faint">
                    Tambah anggota
                  </p>
                  <div className="mt-2">
                    <QuickAddMemberForm
                      crossId={cross.id}
                      existingNames={memberNames}
                    />
                  </div>

                  <p className="mt-6 border-t border-rule-soft pt-4 font-mono text-[0.625rem] uppercase tracking-[0.16em] text-ink-faint">
                    Anggota ({members.length})
                  </p>
                  {members.length === 0 ? (
                    <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                      Belum ada anggota tercatat. Ketik nama di kotak di
                      atas untuk mulai mengisi — tidak perlu menunggu daftar
                      lengkap, tambahkan satu-satu saja.
                    </p>
                  ) : (
                    <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                      {members.map((m) => (
                        <li
                          key={m.id}
                          className="flex items-center gap-2.5 rounded-md border border-line px-3 py-2"
                        >
                          <Monogram name={m.nickname} size="sm" />
                          <span className="truncate text-sm text-ink">
                            {m.nickname}
                          </span>
                          {leaderIds.has(m.id) && (
                            <span className="tag tag-accent ml-auto shrink-0">
                              CL
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              );
            })
          )}
        </div>
      )}

      {notPersonallyLed.length > 0 && (
        <div className="mt-10 border-t border-rule pt-8">
          <h2 className="font-mono text-[0.6875rem] uppercase tracking-[0.18em] text-ink-faint">
            {isAdmin ? "Klaim kepemimpinan resmi" : "Pilih kelompok yang kamu pimpin"}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-muted">
            {isAdmin
              ? "Kamu sudah bisa kelola semua kelompok lewat akses admin. Klaim di sini kalau kamu memang pemimpin salah satunya, supaya namamu muncul sebagai CL."
              : "Kalau kamu memimpin salah satu kelompok di bawah, klaim supaya bisa langsung menambah anggotanya. Kode akses ada di pengurus — tanya kalau belum tahu."}
          </p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {notPersonallyLed.map((cross) => (
              <ClaimCrossCard key={cross.id} cross={cross} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
