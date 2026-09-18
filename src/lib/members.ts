import type { MemberStatus, Profile } from "./types";

export type MemberStatusFilter = MemberStatus | "all";

export const MEMBER_STATUS_FILTERS: { value: MemberStatusFilter; label: string }[] = [
  { value: "all", label: "Semua status" },
  { value: "active", label: "Aktif" },
  { value: "away", label: "Berhalangan" },
  { value: "alumni", label: "Alumni" },
  { value: "inactive", label: "Tidak aktif" },
];

export function parseMemberStatusFilter(raw: unknown): MemberStatusFilter {
  return raw === "active" || raw === "away" || raw === "alumni" || raw === "inactive"
    ? raw
    : "all";
}

/**
 * Directory filtering — status first, then one text query matched against
 * nickname, full name, and Cross names. Pure, so the list page (server)
 * and the tests share exactly the same rule.
 */
export function filterMembers(
  profiles: Profile[],
  crossNames: Record<string, string[]>,
  query: string,
  status: MemberStatusFilter
): Profile[] {
  const q = query.trim().toLowerCase();
  return profiles.filter((p) => {
    if (status !== "all" && p.status !== status) return false;
    if (!q) return true;
    const haystack =
      `${p.nickname} ${p.fullName} ${(crossNames[p.id] ?? []).join(" ")}`.toLowerCase();
    return haystack.includes(q);
  });
}

/** Header counts across every status — no group silently dropped. */
export function countByStatus(profiles: Profile[]): Record<MemberStatus, number> {
  const counts: Record<MemberStatus, number> = {
    active: 0,
    away: 0,
    alumni: 0,
    inactive: 0,
  };
  for (const p of profiles) {
    counts[p.status] = (counts[p.status] ?? 0) + 1;
  }
  return counts;
}
