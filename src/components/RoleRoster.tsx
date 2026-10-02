import { AlertTriangle } from "lucide-react";
import type { Profile } from "@/lib/types";
import { STEWARD_ROLES, type StewardRole } from "@/lib/validation";
import { isOverloaded, FATIGUE_WINDOW_DAYS } from "@/lib/fatigue";
import { slotStatus, SLOT_NEEDS } from "@/lib/stewards";
import { AssignStewardForm } from "./AssignStewardForm";
import { StewardRemoveButton } from "./StewardRemoveButton";

export interface RosterSteward {
  id: string;
  profileId: string;
  role: string;
  status: string;
}

const STATUS_NOTE: Record<string, string> = {
  assigned: "belum konfirmasi",
  change_requested: "minta diganti",
};

/**
 * One Saturday as a ruled table: Peran · Petugas · Slot.
 *
 * The same reading order Grace/Nita use in their spreadsheet, at any
 * width — the phone board shows one Saturday through this, and the
 * service detail page shows its own. Load (N× / 30 hari) sits beside
 * every name; overload is a word + icon, never colour alone.
 */
export function RoleRoster({
  eventId,
  eventLabel,
  stewards,
  profiles,
  crossNames,
  canManage,
  readOnly = false,
  showStatus = false,
}: {
  eventId: string;
  eventLabel: string;
  stewards: RosterSteward[];
  profiles: Profile[];
  crossNames: Record<string, string[]>;
  canManage: boolean;
  /** Past Saturdays and comparison columns: names only, no controls. */
  readOnly?: boolean;
  /** "belum konfirmasi" under a name — useful on the detail page. */
  showStatus?: boolean;
}) {
  const byId = new Map(profiles.map((p) => [p.id, p]));
  const manage = canManage && !readOnly;

  return (
    <table className="w-full table-fixed border-collapse text-sm">
      <caption className="sr-only">Penatalayan {eventLabel}</caption>
      <colgroup>
        <col className="w-[6.5rem] sm:w-36" />
        <col />
        <col className="w-12 sm:w-16" />
      </colgroup>
      <thead>
        <tr className="border-b border-rule">
          {["Peran", "Petugas", "Slot"].map((h, i) => (
            <th
              key={h}
              scope="col"
              className={`py-2 font-mono text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-ink-muted ${
                i === 2 ? "text-right" : "text-left"
              }`}
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {STEWARD_ROLES.map((role: StewardRole) => {
          const rows = stewards.filter((s) => s.role === role && s.status !== "replaced");
          const slot = slotStatus(role, rows.length);
          const need = SLOT_NEEDS[role];
          const missing = slot.tone === "empty" || slot.tone === "partial";
          // Pemusik has no upper limit, so it can always take one more.
          const canAdd = manage && (missing || need.max === null);
          const count =
            need.max === null ? `${rows.length}` : `${rows.length}/${need.max}`;
          return (
            <tr key={role} className="border-t border-rule-soft align-top first:border-t-0">
              <th scope="row" className="py-3 pr-2 text-left font-semibold text-ink">
                {role}
              </th>
              <td className="py-2.5 pr-2">
                {rows.length === 0 && !canAdd && (
                  <span className="text-ink-muted">Belum ada</span>
                )}
                <ul className="space-y-1">
                  {rows.map((s) => {
                    const p = byId.get(s.profileId);
                    const name = p?.nickname ?? "—";
                    const load = p?.serviceCount30d ?? 0;
                    const hot = isOverloaded(load);
                    return (
                      <li key={s.id} className="flex min-h-[44px] items-center gap-2">
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-ink">{name}</span>
                          {showStatus && STATUS_NOTE[s.status] && (
                            <span className="block text-xs text-ink-muted">
                              {STATUS_NOTE[s.status]}
                            </span>
                          )}
                        </span>
                        <span
                          className={`num inline-flex shrink-0 items-center gap-1 font-mono text-xs ${
                            hot ? "text-warning" : "text-ink-muted"
                          }`}
                          title={`${load}× dalam ${FATIGUE_WINDOW_DAYS} hari`}
                        >
                          {load}&times;
                          {hot && (
                            <>
                              <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                              <span className="sr-only">beban tinggi</span>
                            </>
                          )}
                        </span>
                        {manage && (
                          <StewardRemoveButton
                            assignmentId={s.id}
                            eventId={eventId}
                            name={name}
                            role={role}
                          />
                        )}
                      </li>
                    );
                  })}
                </ul>
                {canAdd && (
                  <div className={rows.length ? "mt-1.5" : ""}>
                    <AssignStewardForm
                      eventId={eventId}
                      eventLabel={eventLabel}
                      profiles={profiles}
                      crossNames={crossNames}
                      presetRole={role}
                      buttonLabel="Tambah"
                      variant="dashed"
                    />
                  </div>
                )}
              </td>
              <td
                className={`num py-3 text-right font-mono ${
                  slot.tone === "full"
                    ? "text-sage"
                    : missing
                      ? "text-warning"
                      : "text-ink-muted"
                }`}
              >
                {count}
                <span className="sr-only"> — {slot.sub}</span>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
