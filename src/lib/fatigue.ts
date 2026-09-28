/**
 * Ambang beban pelayanan.
 *
 * Keputusan Dex 28 Sep 2026: >2× pelayanan dalam 30 hari = kebanyakan,
 * saatnya diistirahatkan/diganti. Berlaku di semua penanda (dashboard,
 * direktori anggota, Papan Penatalayan). Satu konstanta supaya tidak ada
 * lagi angka 2/3 tersebar yang diam-diam beda arti.
 *
 * Dihitung dari TANGGAL ibadah, bukan stempel tulis baris — pelajaran
 * 19 Ags 2026 (stempel impor membuat semua orang terlihat 10–15×).
 */
export const FATIGUE_THRESHOLD = 2;

export const FATIGUE_WINDOW_DAYS = 30;

export function isOverloaded(serviceCount30d: number): boolean {
  return serviceCount30d > FATIGUE_THRESHOLD;
}
