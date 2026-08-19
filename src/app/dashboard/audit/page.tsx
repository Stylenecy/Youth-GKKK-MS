import type { Metadata } from "next";
import { getRecentActivity, isSupabaseConfigured } from "@/lib/data";
import { PageHeader, EmptyState } from "@/components/page-parts";
import { formatDateTime } from "@/lib/datetime";
import { ShieldCheck, History, Activity, AlertCircle } from "lucide-react";

export const metadata: Metadata = { title: "Log Audit" };

export default async function AuditPage() {
  const activities = await getRecentActivity(100);
  const live = isSupabaseConfigured();

  return (
    <div className="px-5 py-7 sm:px-8 sm:py-9">
      <PageHeader
        kicker="KEAMANAN & RIWAYAT"
        title="Jejak Audit & Aktivitas"
        meta="Setiap perubahan jadwal, transaksi keuangan, dan struktur anggota tercatat secara permanen tanpa risiko kehilangan data."
      />

      {!live && (
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-warning/40 bg-warning-wash/70 p-4 text-xs sm:text-sm text-warning backdrop-blur-xl">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>
            <strong>Mode Demo:</strong> Supabase belum terhubung ke basis data langsung. Riwayat aktivitas di bawah ini merupakan data contoh (mock).
          </span>
        </div>
      )}

      {activities.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="Belum ada catatan aktivitas"
            body="Seluruh mutasi data, penugasan penatalayan, dan entri kas akan otomatis terarsip di sini."
            icon={History}
          />
        </div>
      ) : (
        <div className="mt-8">
          <div className="flex items-center justify-between border-b border-rule-soft pb-3 mb-6">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              <h2 className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-accent">
                ( TIMELINE MUTASI SISTEM )
              </h2>
            </div>
            <span className="font-mono text-xs text-ink-faint">
              {activities.length} Log Peristiwa
            </span>
          </div>

          <ol className="relative divide-y divide-rule-soft/60 rounded-2xl border border-line/40 bg-surface/75 backdrop-blur-xl overflow-hidden shadow-sm">
            {activities.map((a) => (
              <li
                key={a.id}
                className="group flex items-start gap-4 p-5 transition-colors hover:bg-surface-2/60 sm:px-6"
              >
                <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border border-line-accent/40 bg-accent-wash text-accent">
                  <Activity className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm sm:text-base font-semibold leading-snug text-ink group-hover:text-accent transition-colors">
                    {a.description}
                  </p>
                  <p className="mt-1.5 font-mono text-xs font-medium text-ink-muted">
                    {formatDateTime(a.createdAt)} WIB
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
