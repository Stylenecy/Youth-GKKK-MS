/**
 * Pesan error Postgres/Supabase diterjemahkan untuk pengurus yang belum
 * pernah melihat stack trace. Dipakai semua server action — satu pola:
 * yang dikenal dipetakan, yang mengandung pola umum ditebak jenisnya,
 * sisanya pesan generik (yang mentah masuk Vercel logs via console.error,
 * bukan ke layar pengguna).
 */
const KNOWN: Record<string, string> = {
  // RPC 0004 (Cross)
  not_authenticated: "Kamu belum masuk. Coba masuk ulang.",
  invalid_code: "Kode akses salah. Cek lagi ke pengurus.",
  cross_not_found: "Kelompok ini tidak ditemukan — mungkin sudah diarsipkan.",
  name_required: "Nama wajib diisi.",
  name_too_long: "Nama terlalu panjang (maksimal 80 karakter).",
  not_a_leader_of_this_group:
    "Kamu bukan pemimpin kelompok ini, jadi tidak bisa menambah anggota di sini.",
  // RPC 0011 (approval)
  not_an_admin: "Hanya admin yang bisa menyetujui atau menolak akun.",
  invalid_status: "Status tidak dikenal.",
  cannot_revoke_self: "Kamu tidak bisa mencabut aksesmu sendiri.",
  account_not_found: "Akun itu tidak ditemukan — mungkin sudah dihapus.",
  // RPC 0012 (absensi)
  not_allowed_to_record:
    "Kamu tidak punya hak mencatat kehadiran ini — hanya pengurus, PIC ibadah, atau pemimpin Cross atas anggotanya sendiri.",
  // Trigger 0013 (PIC)
  pic_must_be_pengurus:
    "PIC harus pengurus — pengurus inti atau pemimpin Cross yang masih aktif.",
};

export function friendlyDbError(
  message: string | undefined,
  fallback = "Gagal menyimpan. Coba lagi — kalau berulang, hubungi admin."
): string {
  if (!message) return fallback;
  if (KNOWN[message]) return KNOWN[message];
  if (
    message.includes("row-level security") ||
    message.includes("permission denied") ||
    message.includes("not authorized")
  )
    return "Akses ditolak database. Kalau kamu pengurus dan ini berulang, hubungi admin.";
  if (message.includes("duplicate key"))
    return "Data ini sudah ada (duplikat) — tidak disimpan dua kali.";
  if (message.includes("foreign key"))
    return "Data terkait tidak ditemukan. Muat ulang halaman lalu coba lagi.";
  console.error("[db]", message);
  return fallback;
}
