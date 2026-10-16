import { isSupabaseConfigured } from "./supabase/env";

/**
 * One rule for demo mode (no Supabase), used by every write:
 * - data writes (ibadah, penatalayan, kas, impor kas, absensi) are validated
 *   exactly as in live mode, then answered "berhasil" with this note — so
 *   the preview shows the real flow without pretending it was saved;
 * - writes about the signed-in identity (klaim pemimpin Cross, tambah anggota
 *   Cross, persetujuan akun) need a real login and say so with
 *   DEMO_NEEDS_LOGIN.
 */
export const DEMO_NOTE = " (mode demo — tidak tersimpan)";

export const DEMO_NEEDS_LOGIN =
  "Mode demo — fitur ini butuh akun yang masuk, jadi tidak dijalankan di pratinjau.";

/** "" in live mode, DEMO_NOTE in demo mode. Safe in client components. */
export function demoNote(): string {
  return isSupabaseConfigured() ? "" : DEMO_NOTE;
}
