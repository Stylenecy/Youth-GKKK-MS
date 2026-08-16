import Link from "next/link";
import type { Metadata } from "next";
import { getProfiles } from "@/lib/data";
import { PageHeader, EmptyState, Monogram } from "@/components/page-parts";

export const metadata: Metadata = { title: "Anggota" };

const STATUS: Record<string, { label: string; cls: string }> = {
  active: { label: "Aktif", cls: "tag tag-sage" },
  away: { label: "Berhalangan", cls: "tag tag-warning" },
  alumni: { label: "Alumni", cls: "tag" },
  inactive: { label: "Tidak aktif", cls: "tag" },
};

export default async function MembersPage() {
  const profiles = await getProfiles();

  const activeCount = profiles.filter((p) => p.status === "active").length;

  return (
    <div className="px-5 py-7 sm:px-8 sm:py-9">
      <PageHeader
        kicker="Orang"
        title="Anggota"
        meta={`${profiles.length} terdaftar · ${activeCount} aktif`}
      />

      {profiles.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="Belum ada anggota"
            body="Anggota muncul di sini begitu pemimpin Cross menambahkannya lewat Kelompokku — tidak perlu daftar lengkap dulu, satu-satu juga cukup."
          />
        </div>
      ) : (
        <ul className="mt-8 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {profiles.map((profile) => {
            const s = STATUS[profile.status] ?? STATUS.inactive;
            return (
              <li key={profile.id}>
                <Link
                  href={`/dashboard/members/${profile.id}`}
                  className="card-surface flex h-full items-center gap-3 p-4"
                >
                  <Monogram name={profile.nickname} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-serif text-base font-semibold text-ink">
                      {profile.nickname}
                    </span>
                    <span className="block truncate text-sm text-ink-muted">
                      {profile.fullName}
                    </span>
                    <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <span className={s.cls}>{s.label}</span>
                      {profile.serviceCount30d > 0 && (
                        <span className="num font-mono text-[0.625rem] text-ink-faint">
                          {profile.serviceCount30d}× bulan ini
                        </span>
                      )}
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
