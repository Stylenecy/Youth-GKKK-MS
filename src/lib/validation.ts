/**
 * Client-side mirror of the checks add_cross_member() runs in SQL.
 *
 * The database is the real authority — this only exists so a leader gets
 * an instant "nama wajib diisi" instead of waiting on a round trip for a
 * mistake the client could have caught. Keep the two in sync if either
 * changes; they are intentionally simple enough that drift is easy to spot.
 */
export function validateMemberName(raw: string): { ok: true; value: string } | { ok: false; error: string } {
  const value = raw.trim();
  if (value.length < 1) {
    return { ok: false, error: "Nama wajib diisi." };
  }
  if (value.length > 80) {
    return { ok: false, error: "Nama terlalu panjang (maksimal 80 karakter)." };
  }
  return { ok: true, value };
}

/**
 * The only steward slots the ministry actually fills — WL, Singer, Pemusik,
 * Multimedia, Sound, Usher. Taken from the seed roster and the 2026 import
 * (19 Sep 2026 audit). Both the tick-box form and the server action check
 * against this list so a typo'd role can never reach steward_assignments.
 */
export const STEWARD_ROLES = [
  "WL",
  "Singer",
  "Pemusik",
  "Multimedia",
  "Sound",
  "Usher",
] as const;

export type StewardRole = (typeof STEWARD_ROLES)[number];

export function isStewardRole(raw: string): raw is StewardRole {
  return (STEWARD_ROLES as readonly string[]).includes(raw);
}
