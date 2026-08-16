import type { Metadata } from "next";
import { getRecentActivity, isSupabaseConfigured } from "@/lib/data";
import { PageHeader, EmptyState } from "@/components/page-parts";
import { formatDateTime } from "@/lib/datetime";

export const metadata: Metadata = { title: "Audit" };

export default async function AuditPage() {
  const activities = await getRecentActivity();
  const live = isSupabaseConfigured();

  return (
    <div className="px-5 py-7 sm:px-8 sm:py-9">
      <PageHeader
        kicker="Riwayat"
        title="Audit"
        meta="Setiap perubahan tercatat. Data tidak pernah dihapus permanen."
      />

      {!live && (
        <p className="mt-6 rounded-md bg-warning-wash px-4 py-3 text-sm text-warning">
          Supabase belum tersambung — yang tampil di bawah adalah contoh, bukan
          riwayat sungguhan.
        </p>
      )}

      {activities.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="Belum ada aktivitas"
            body="Perubahan jadwal, penatalayan, dan keuangan akan muncul di sini beserta waktunya."
          />
        </div>
      ) : (
        <ol className="mt-8 border-t border-rule">
          {activities.map((a) => (
            <li key={a.id} className="border-b border-rule py-4">
              <p className="text-[0.9375rem] leading-snug text-ink">
                {a.description}
              </p>
              <p className="mt-1 font-mono text-[0.625rem] uppercase tracking-[0.1em] text-ink-faint">
                {formatDateTime(a.createdAt)}
              </p>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
