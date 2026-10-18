import Link from "next/link";
import type { Metadata } from "next";
import { getProfiles, getProfileCrossNames } from "@/lib/data";
import {
  filterMembers,
  countByStatus,
  parseMemberStatusFilter,
  sortMembersByName,
  MEMBER_STATUS_DOT,
  MEMBER_STATUS_TAG,
  type MemberStatusFilter,
} from "@/lib/members";
import type { MemberStatus } from "@/lib/types";
import { PageHeader, EmptyState } from "@/components/page-parts";
import { Users, Search } from "lucide-react";

export const metadata: Metadata = { title: "Direktori Anggota" };

const STATUS_ORDER: MemberStatus[] = ["active", "away", "alumni", "inactive"];

function filterHref(status: MemberStatusFilter, q: string): string {
  const params = new URLSearchParams();
  if (q.trim()) params.set("q", q.trim());
  if (status !== "all") params.set("status", status);
  const qs = params.toString();
  return qs ? `/dashboard/members?${qs}` : "/dashboard/members";
}

/** Same dot as the list rows, so the legend is the key to read them. */
function StatusDot({ status }: { status: MemberStatus }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full border-2 ${MEMBER_STATUS_DOT[status].dot}`}
    />
  );
}

/**
 * Direktori anggota — daftar ringkas (masukan Nathan + Dex, 18 Okt 2026).
 *
 * The old 3-column card grid showed ~6 people per screen. This is a
 * phone-book list: one line per person, alphabetical, flowing down the
 * columns (4 on a laptop; 2 left-to-right on a phone), so most of Pemuda
 * fits on one screen. Status is
 * the dot's colour and shape; the legend above doubles as the filter.
 */
export default async function MembersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  const status = parseMemberStatusFilter(params.status);

  const [profiles, crossNames] = await Promise.all([
    getProfiles(),
    getProfileCrossNames(),
  ]);
  const counts = countByStatus(profiles);
  const pengurusCount = profiles.filter((p) => p.isPengurus).length;
  const visible = sortMembersByName(filterMembers(profiles, crossNames, q, status));

  return (
    <div className="px-5 py-7 sm:px-8 sm:py-9">
      <PageHeader
        kicker="DIREKTORI JEMAAT"
        title="Daftar Anggota"
        meta={`${profiles.length} anggota · ${pengurusCount} pengurus`}
        action={
          <Link
            href="/dashboard/cross/mine"
            className="btn-primary text-xs sm:text-sm"
          >
            <Users className="h-4 w-4" aria-hidden="true" />
            Tambah via Kelompokku
          </Link>
        }
      />

      {/* Server-side search: works with zero client JS. The status filter
          lives in the legend links below, so the form only carries it. */}
      <form
        method="get"
        role="search"
        aria-label="Cari anggota"
        className="mt-6 flex gap-2.5"
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
        {status !== "all" && <input type="hidden" name="status" value={status} />}
        <button type="submit" className="btn-outline min-h-[44px] text-sm">
          Cari
        </button>
      </form>

      <nav aria-label="Saring status" className="mt-4">
        <ul className="flex flex-wrap gap-2">
          <li>
            <Link
              href={filterHref("all", q)}
              aria-current={status === "all" ? "true" : undefined}
              className={`inline-flex min-h-[36px] items-center gap-2 rounded-full border px-3 text-xs font-medium transition-colors ${
                status === "all"
                  ? "border-line-accent bg-accent-wash/60 text-ink"
                  : "border-line/60 text-ink-muted hover:text-ink"
              }`}
            >
              Semua <span className="num font-mono">{profiles.length}</span>
            </Link>
          </li>
          {STATUS_ORDER.map((s) =>
            counts[s] === 0 ? null : (
              <li key={s}>
                <Link
                  href={filterHref(s, q)}
                  aria-current={status === s ? "true" : undefined}
                  className={`inline-flex min-h-[36px] items-center gap-2 rounded-full border px-3 text-xs font-medium transition-colors ${
                    status === s
                      ? "border-line-accent bg-accent-wash/60 text-ink"
                      : "border-line/60 text-ink-muted hover:text-ink"
                  }`}
                >
                  <StatusDot status={s} />
                  {MEMBER_STATUS_TAG[s].label}
                  <span className="num font-mono">{counts[s]}</span>
                </Link>
              </li>
            )
          )}
        </ul>
      </nav>

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
        <div className="mt-6">
          <p className="lp-meta mb-3">
            {visible.length === profiles.length
              ? "Urut abjad"
              : `${visible.length} dari ${profiles.length} · urut abjad`}
            {" · "}
            <span aria-hidden="true" className="tag tag-accent px-1.5 py-0 text-[0.625rem]">P</span>
            <span aria-hidden="true"> = pengurus</span>
          </p>
          {/* Phone/tablet: left-to-right rows, so scrolling stays in ABC order.
              Laptop: phone-book columns, which mostly fit on one screen. */}
          <ul className="grid grid-cols-2 gap-x-4 border-t border-rule-soft sm:gap-x-6 lg:block lg:columns-3 xl:columns-4">
            {visible.map((profile) => {
              const look = MEMBER_STATUS_DOT[profile.status] ?? MEMBER_STATUS_DOT.inactive;
              const label = MEMBER_STATUS_TAG[profile.status]?.label ?? "Tidak aktif";
              const crosses = crossNames[profile.id] ?? [];
              return (
                <li key={profile.id} className="break-inside-avoid border-b border-rule-soft">
                  <Link
                    href={`/dashboard/members/${profile.id}`}
                    title={[profile.fullName, label, crosses.join(", ")].filter(Boolean).join(" · ")}
                    className="group flex min-h-[44px] items-center gap-2.5 px-1 py-1.5 sm:min-h-[38px]"
                  >
                    <StatusDot status={profile.status} />
                    <span className="min-w-0 flex-1 truncate text-sm">
                      <span className={`font-medium group-hover:text-accent ${look.name}`}>
                        {profile.nickname}
                      </span>
                      {profile.fullName !== profile.nickname && (
                        <span className="ml-1.5 hidden text-xs text-ink-faint sm:inline">
                          {profile.fullName}
                        </span>
                      )}
                    </span>
                    <span className="sr-only">— {label}</span>
                    {profile.isPengurus && (
                      <span className="tag tag-accent shrink-0 px-1.5 py-0 text-[0.625rem]">
                        <span aria-hidden="true">P</span>
                        <span className="sr-only">Pengurus</span>
                      </span>
                    )}
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
