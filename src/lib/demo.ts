import { isSupabaseConfigured } from "./supabase/env";

/**
 * One rule for demo mode (no Supabase), used by every write:
 * - data writes (ibadah, penatalayan, kas, impor kas, absensi) are validated
 *   exactly as in live mode, then answered with DEMO_SAVED instead of the
 *   live "berhasil disimpan" — the preview shows the real flow without ever
 *   claiming something was saved;
 * - writes about the signed-in identity (klaim pemimpin Cross, tambah anggota
 *   Cross, persetujuan akun) need a real login and say so with
 *   DEMO_NEEDS_LOGIN.
 */
export const DEMO_SAVED = "Isian sudah benar. Mode demo: data tidak disimpan.";

/** For messages that keep their own wording (e.g. "Dex ditetapkan sebagai WL"). */
export const DEMO_NOTE = " (mode demo, tidak disimpan)";

export const DEMO_NEEDS_LOGIN =
  "Mode demo: fitur ini baru jalan kalau kamu masuk dengan akun Google.";

/** The live confirmation, or DEMO_SAVED in demo mode. Safe in client components. */
export function savedMessage(live: string): string {
  return isSupabaseConfigured() ? live : DEMO_SAVED;
}

/** "" in live mode, DEMO_NOTE in demo mode. */
export function demoNote(): string {
  return isSupabaseConfigured() ? "" : DEMO_NOTE;
}
