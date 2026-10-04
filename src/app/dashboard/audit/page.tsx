import type { Metadata } from "next";
import { getRecentActivity, getMyRole, isSupabaseConfigured } from "@/lib/data";
import { canViewAudit } from "@/lib/roles";
import { PageHeader, EmptyState, SectionTitle } from "@/components/page-parts";
import { formatDateTime } from "@/lib/datetime";
import { History, Activity, AlertCircle, Lock } from "lucide-react";

export const metadata: Metadata = { title: "Log Audit" };

export default async function AuditPage() {
  const role = await getMyRole();
  const live = isSupabaseConfigured();
  // audit_logs is admin-only in RLS (0010). Without this a non-admin read
  // "Belum ada catatan" — which sounds like nothing ever happened.
  const allowed = canViewAudit(role);
  const activities = allowed ? await getRecentActivity(100) : [];

  return (
    <div className="px-5 py-7 sm:px-8 sm:py-9">
      <PageHeader
        kicker="KEAMANAN & RIWAYAT"
        title="Jejak Audit & Aktivitas"
        meta="Setiap perubahan jadwal, transaksi keuangan, dan struktur anggota tercatat secara permanen tanpa risiko kehilangan data."
      />

      {!live && (
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-warning/40 bg-warning-wash/70 p-4 text-xs sm:text-sm text-warning">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>
            <strong>Mode Demo:</strong> Supabase belum terhubung ke basis data langsung. Riwayat aktivitas di bawah ini merupakan data contoh.
          </span>
        </div>
      )}

      {!allowed ? (
        <div className="mt-8">
          <EmptyState
            title="Log audit khusus admin"
            body="Jejak perubahan berisi data keuangan dan akun, jadi hanya admin yang bisa membukanya. Kalau perlu tahu siapa mengubah sesuatu, tanyakan ke admin."
            icon={Lock}
          />
        </div>
      ) : activities.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="Belum ada catatan aktivitas"
            body="Seluruh mutasi data, penugasan penatalayan, dan entri kas akan otomatis terarsip di sini."
            icon={History}
          />
        </div>
      ) : (
        <div className="mt-8">
          <SectionTitle title="Riwayat perubahan" meta={`${activities.length} catatan`} />

          <ol className="mt-6 relative divide-y divide-rule-soft/60 rounded-2xl border border-line/40 bg-surface/75 overflow-hidden shadow-sm">
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
                    {formatDateTime(a.createdAt)}
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
