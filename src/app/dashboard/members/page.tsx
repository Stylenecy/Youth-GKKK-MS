import Link from "next/link";
import type { Metadata } from "next";
import { getProfiles, getProfileCrossNames } from "@/lib/data";
import {
  filterMembers,
  countByStatus,
  parseMemberStatusFilter,
  MEMBER_STATUS_FILTERS,
} from "@/lib/members";
import { PageHeader, EmptyState, Monogram } from "@/components/page-parts";
import { Users, ChevronRight, Search } from "lucide-react";

export const metadata: Metadata = { title: "Direktori Anggota" };

const STATUS: Record<string, { label: string; cls: string }> = {
  active: { label: "Aktif", cls: "tag tag-sage font-medium" },
  away: { label: "Berhalangan", cls: "tag tag-warning font-medium" },
  alumni: { label: "Alumni", cls: "tag font-medium opacity-75" },
  inactive: { label: "Tidak aktif", cls: "tag font-medium opacity-60" },
};

export default async function MembersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  const status = parseMemberStatusFilter(params.status);
  const filtered = q.trim() !== "" || status !== "all";

  const [profiles, crossNames] = await Promise.all([
    getProfiles(),
    getProfileCrossNames(),
  ]);
  const counts = countByStatus(profiles);
  const visible = filterMembers(profiles, crossNames, q, status);

  return (
    <div className="px-5 py-7 sm:px-8 sm:py-9">
      <PageHeader
        kicker="DIREKTORI JEMAAT"
        title="Daftar Anggota"
        meta={`${profiles.length} anggota · ${counts.active} aktif · ${counts.away} berhalangan · ${counts.alumni} alumni · ${counts.inactive} tidak aktif`}
        action={
          <Link
            href="/dashboard/cross/mine"
            className="btn-primary text-xs sm:text-sm shadow-[0_0_16px_rgba(253,190,2,0.25)]"
          >
            <Users className="h-4 w-4" aria-hidden="true" />
            Tambah via Kelompokku
          </Link>
        }
      />

      {/* Server-side filter: works with zero client JS, so it costs no bundle. */}
      <form
        method="get"
        role="search"
        aria-label="Cari dan saring anggota"
        className="mt-6 flex flex-col gap-2.5 sm:flex-row"
      >
        <label className="relative block flex-1">
          <span className="sr-only">Cari nama atau Cross</span>
          <Search
            aria-hidden
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint"
          />
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Cari nama atau Cross…"
            className="min-h-[44px] w-full rounded-xl border border-line bg-surface/70 py-2.5 pl-10 pr-3 text-sm text-ink placeholder:text-ink-faint focus:border-line-accent focus:outline-none"
          />
        </label>
        <div className="flex gap-2.5">
          <label className="sr-only" htmlFor="member-status">
            Saring berdasarkan status
          </label>
          <select
            id="member-status"
            name="status"
            defaultValue={status}
            className="min-h-[44px] flex-1 rounded-xl border border-line bg-surface/70 px-3 text-sm text-ink focus:border-line-accent focus:outline-none sm:flex-none"
          >
            {MEMBER_STATUS_FILTERS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
          <button type="submit" className="btn-outline min-h-[44px] text-sm">
            Cari
          </button>
        </div>
      </form>

      {profiles.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="Belum ada anggota terdaftar"
            body="Anggota akan muncul di sini segera setelah pemimpin Cross menambahkannya melalui menu Kelompokku."
            icon={Users}
          />
        </div>
      ) : visible.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="Tidak ada yang cocok"
            body="Coba kata kunci lain atau kembalikan saringan ke semua status."
            icon={Search}
            action={
              <Link href="/dashboard/members" className="btn-outline text-sm">
                Tampilkan semua
              </Link>
            }
          />
        </div>
      ) : (
        <div className="mt-8">
          <div className="flex items-center justify-between border-b border-rule-soft pb-3 mb-6">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              <h2 className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-accent">
                ( SEMUA ANGGOTA YOUTH )
              </h2>
            </div>
            <span className="font-mono text-xs text-ink-faint" aria-live="polite">
              {filtered
                ? `${visible.length} dari ${profiles.length} Anggota`
                : `${profiles.length} Anggota`}
            </span>
          </div>

          <ul className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((profile) => {
              const s = STATUS[profile.status] ?? STATUS.inactive;
              const isFatigued = profile.serviceCount30d > 3;
              const crosses = crossNames[profile.id] ?? [];
              return (
                <li key={profile.id}>
                  <Link
                    href={`/dashboard/members/${profile.id}`}
                    className="group relative flex h-full items-center gap-4 rounded-2xl border border-line/40 bg-surface/75 p-4.5 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-accent hover:bg-surface hover:shadow-[0_12px_32px_rgba(253,190,2,0.12)]"
                  >
                    <Monogram name={profile.nickname} size="lg" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="truncate font-serif text-lg font-bold text-ink group-hover:text-accent transition-colors">
                          {profile.nickname}
                        </span>
                        <ChevronRight className="h-3.5 w-3.5 text-ink-faint opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-0.5" />
                      </div>
                      <span className="block truncate text-xs text-ink-muted mt-0.5">
                        {profile.fullName}
                      </span>
                      {crosses.length > 0 && (
                        <span
                          className="mt-1 block truncate font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-accent"
                          title={crosses.join(", ")}
                        >
                          {crosses.join(" · ")}
                        </span>
                      )}
                      {profile.notes && (
                        <span className="mt-1 block truncate text-xs text-ink-faint">
                          {profile.notes}
                        </span>
                      )}
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <span className={s.cls}>{s.label}</span>
                        {profile.serviceCount30d > 0 && (
                          <span
                            className={`num font-mono text-[0.625rem] font-bold px-2 py-0.5 rounded-full border ${
                              isFatigued
                                ? "border-warning/40 bg-warning-wash text-warning"
                                : "border-line-accent/30 bg-accent-wash/60 text-accent"
                            }`}
                          >
                            {profile.serviceCount30d}&times; bulan ini
                          </span>
                        )}
                      </div>
                    </div>
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
