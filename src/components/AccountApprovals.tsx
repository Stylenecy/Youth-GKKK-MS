import { UserCheck, ShieldAlert } from "lucide-react";
import { getAccountApprovals } from "@/lib/data";
import { decideAccount } from "@/app/actions/accounts";
import { ConfirmAction } from "@/components/ConfirmAction";
import { formatDateTime } from "@/lib/datetime";

const STATUS_TAG: Record<string, { label: string; cls: string }> = {
  pending: { label: "Menunggu", cls: "tag tag-warning font-medium" },
  approved: { label: "Disetujui", cls: "tag tag-sage font-medium" },
  rejected: { label: "Ditolak", cls: "tag font-medium opacity-70" },
};

/**
 * Admin panel for the login queue.
 *
 * Renders nothing for non-admins — not because the markup is hidden, but
 * because RLS returns them an empty list. The gate is the database; this is
 * only the control surface for whoever is already allowed through it.
 */
export async function AccountApprovals() {
  const accounts = await getAccountApprovals();
  if (accounts.length === 0) return null;

  const pending = accounts.filter((a) => a.status === "pending");

  return (
    <section
      className="rounded-2xl border border-line/40 bg-surface/75 p-6 backdrop-blur-xl shadow-sm sm:p-7"
      aria-labelledby="approvals-heading"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rule-soft pb-3">
        <div className="flex items-center gap-2">
          <UserCheck className="h-4 w-4 text-accent" aria-hidden="true" />
          <h2
            id="approvals-heading"
            className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-accent"
          >
            Akses Akun
          </h2>
        </div>
        {pending.length > 0 && (
          <span className="tag tag-warning font-medium">
            {pending.length} menunggu
          </span>
        )}
      </div>

      <p className="mt-4 text-xs leading-relaxed text-ink-muted sm:text-sm">
        Siapa pun bisa masuk dengan akun Google, tapi tidak melihat apa pun
        sampai disetujui di sini. Setujui hanya orang yang kamu kenal sebagai
        pengurus atau pemimpin Cross.
      </p>

      <ul className="mt-5 divide-y divide-rule-soft/60">
        {accounts.map((account) => {
          const tag = STATUS_TAG[account.status] ?? STATUS_TAG.pending;
          return (
            <li
              key={account.userId}
              className="flex flex-wrap items-center justify-between gap-3 py-3.5"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">
                  {account.displayName ?? account.email}
                </p>
                <p className="truncate font-mono text-xs text-ink-muted">
                  {account.email}
                </p>
                <p className="mt-0.5 font-mono text-[0.6875rem] text-ink-faint">
                  Masuk {formatDateTime(account.requestedAt)} WIB
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <span className={tag.cls}>{tag.label}</span>

                {account.status !== "approved" && (
                  <ConfirmAction
                    label="Setujui"
                    title="Setujui akses akun?"
                    body={`${account.email} akan bisa melihat data jemaat, jadwal, dan keuangan Komisi Pemuda. Setujui hanya kalau kamu mengenal orang ini sebagai pengurus.`}
                    confirmLabel="Ya, setujui"
                    variant="outline"
                    onConfirm={async () => {
                      "use server";
                      return decideAccount(account.userId, "approved");
                    }}
                  />
                )}

                {account.status !== "rejected" && (
                  <ConfirmAction
                    label="Tolak"
                    title="Tolak akses akun?"
                    body={`${account.email} tidak akan bisa melihat data apa pun. Akunnya tidak dihapus — kamu bisa menyetujuinya nanti.`}
                    confirmLabel="Ya, tolak"
                    onConfirm={async () => {
                      "use server";
                      return decideAccount(account.userId, "rejected");
                    }}
                  />
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-rule-soft bg-canvas-sunk/60 p-4 text-xs leading-relaxed text-ink-muted">
        <ShieldAlert className="h-3.5 w-3.5 shrink-0 mt-0.5" aria-hidden="true" />
        <span>
          Menolak akun tidak menghapusnya — riwayatnya tetap tersimpan, dan
          keputusannya bisa diubah kapan saja.
        </span>
      </div>
    </section>
  );
}
