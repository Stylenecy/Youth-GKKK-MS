import Link from "next/link";
import type { Metadata } from "next";
import { getProfiles } from "@/lib/data";
import { PageHeader, EmptyState, Monogram } from "@/components/page-parts";
import { Users, ChevronRight } from "lucide-react";

export const metadata: Metadata = { title: "Direktori Anggota" };

const STATUS: Record<string, { label: string; cls: string }> = {
  active: { label: "Aktif", cls: "tag tag-sage font-medium" },
  away: { label: "Berhalangan", cls: "tag tag-warning font-medium" },
  alumni: { label: "Alumni", cls: "tag font-medium opacity-75" },
  inactive: { label: "Tidak aktif", cls: "tag font-medium opacity-60" },
};

export default async function MembersPage() {
  const profiles = await getProfiles();

  const activeCount = profiles.filter((p) => p.status === "active").length;

  return (
    <div className="px-5 py-7 sm:px-8 sm:py-9">
      <PageHeader
        kicker="DIREKTORI JEMAAT"
        title="Daftar Anggota"
        meta={`${profiles.length} total anggota terdaftar · ${activeCount} berstatus aktif`}
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

      {profiles.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="Belum ada anggota terdaftar"
            body="Anggota akan muncul di sini segera setelah pemimpin Cross menambahkannya melalui menu Kelompokku."
            icon={Users}
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
            <span className="font-mono text-xs text-ink-faint">
              {profiles.length} Anggota
            </span>
          </div>

          <ul className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            {profiles.map((profile) => {
              const s = STATUS[profile.status] ?? STATUS.inactive;
              const isFatigued = profile.serviceCount30d > 3;
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
