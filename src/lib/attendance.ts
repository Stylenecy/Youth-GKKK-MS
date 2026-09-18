import type { AppRole, AttendanceRecord } from "./types";

/**
 * One row of public.attendance as Postgres sends it: snake_case.
 *
 * Only rows the caller may see ever arrive — migration 0012's RLS already
 * narrows SELECT to committee + a leader over their own members, so there is
 * no role check at this layer. Ordinary members receive nothing, not even
 * their own verdict: attendance is pastoral-care data, not a leaderboard.
 */
export interface AttendanceRow {
  id: string;
  event_id: string;
  profile_id: string;
  present: boolean;
  note: string | null;
  recorded_at: string;
}

/**
 * Map the row, never cast it — the same rule as every other table in
 * data.ts. A cast would type-check while leaving every camelCase field
 * silently `undefined`.
 */
export function mapAttendanceRow(row: AttendanceRow): AttendanceRecord {
  return {
    id: row.id,
    eventId: row.event_id,
    profileId: row.profile_id,
    present: row.present,
    note: row.note,
    recordedAt: row.recorded_at,
  };
}

const COMMITTEE_ROLES: AppRole[] = ["admin", "treasurer", "ministry"];

/**
 * Coarse UI gate for the attendance tick-box. Mirrors migration 0012's SQL
 * policy: committee records anywhere, the PIC records their own gathering,
 * a leader records their own members.
 *
 * Two things this deliberately does NOT do: narrow a leader down to their
 * own members' rows (the page does that by loading only those profiles),
 * and enforce anything (mark_attendance() re-checks every write in SQL, so
 * a forged call from DevTools gets 'not_allowed_to_record', not a row).
 */
export function canRecordAttendance(opts: {
  appRole?: AppRole | null;
  isEventPic: boolean;
  leadsAnyCross: boolean;
}): boolean {
  if (opts.appRole && COMMITTEE_ROLES.includes(opts.appRole)) return true;
  if (opts.isEventPic) return true;
  return opts.leadsAnyCross;
}
