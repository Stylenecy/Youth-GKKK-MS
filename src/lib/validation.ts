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
