import type { SupabaseClient } from "@supabase/supabase-js";
import type { AppRole } from "./types";

type Guard =
  | { ok: true; supabase: SupabaseClient; userId: string; role: AppRole }
  | { ok: false; error: string };

/**
 * Cek peran di server action SEBELUM menulis.
 *
 * RLS tetap batas sebenarnya, tapi UPDATE/DELETE yang ditolak RLS tidak
 * melempar error — ia mengubah 0 baris. Tanpa cek ini, non-komite
 * mendapat "berhasil" (plus baris audit) untuk perubahan yang tidak pernah
 * terjadi. Hanya dipanggil saat Supabase terkonfigurasi.
 */
export async function requireRole(
  allowed: readonly AppRole[],
  deniedMessage: string
): Promise<Guard> {
  const { createClient } = await import("./supabase/server");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Kamu belum masuk. Masuk dulu lewat Google." };

  const { data } = await supabase.rpc("get_my_app_role");
  const role = (typeof data === "string" ? data : "member") as AppRole;
  if (!allowed.includes(role)) return { ok: false, error: deniedMessage };
  return { ok: true, supabase, userId: user.id, role };
}

/** Pesan baku untuk tulis ibadah/penatalayan oleh non-komite. */
export const NOT_COMMITTEE =
  "Hanya pengurus (admin, bendahara, tim ibadah) yang bisa mengubah jadwal dan penatalayan.";

/**
 * Pesan saat tulis diterima tanpa error tapi 0 baris berubah: RLS menolak
 * diam-diam, atau baris sudah tidak ada.
 */
export const NOTHING_CHANGED =
  "Perubahan tidak tersimpan — datanya mungkin sudah dihapus, atau akunmu belum diberi izin. Muat ulang halaman lalu coba lagi.";
