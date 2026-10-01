# Audit Area Pengurus — 1 Okt 2026

Sesi: Claude Code (lead engineer). Basis: `f0103ef` di `master`.
Cara uji: dev server lokal **mode demo** (tidak ada `.env.local` → data seed, nol kontak ke Supabase produksi), Chrome headless via CDP dengan emulasi 1440 px dan 390 px. Screenshot sebelum perbaikan ada di `docs/screens/2026-10-01/before/`.

Batas uji yang jujur: mode demo tidak punya login, peran, maupun RLS. Semua temuan peran/izin di bawah berasal dari **baca kode + migrasi**, bukan klik di produksi.

## Baseline (sebelum perubahan)

| Cek | Hasil |
|---|---|
| `npm test` | 14 berkas, **126/126 lulus** |
| `npm run lint` | **51 error, 34 warning**. 19 error di `src/lib/data.ts` (`any`), ~25 di folder ide lama `.agent/Idea/**` (bukan kode app) |
| `npm run build` | hijau, 21 rute |
| Dev 1440/390 | 12 rute 200, **0 error konsol**, **0 overflow horizontal** di 390 px |

Catatan lingkungan: port 2990–3089 dicadangkan Windows (Hyper-V). `next dev` di port 3000 gagal `EACCES`. Pakai `-p 4321`.

## Alur → status

Status: **tuntas** · **patah** (salah/berbahaya) · **setengah** (jalan tapi buntu/kurang umpan balik) · **jelek** (visual/copy).

| # | Alur | Status | Bukti | Prioritas |
|---|---|---|---|---|
| 1 | Login → menunggu/ditolak → Keluar | tuntas | `dashboard/layout.tsx:16`, `PendingApproval` (28 Sep) | — |
| 2 | Admin menyetujui akun (Pengaturan) | setengah | `AccountApprovals.tsx:22` mengembalikan `null` saat antrean kosong → admin tidak melihat bagian itu sama sekali | P1 |
| 3 | Navigasi per peran | patah | `nav-items.ts` tanpa filter peran: semua akun melihat Keuangan/Audit, padahal RLS membuat halaman itu kosong untuk non-admin | P0 |
| 4 | Beranda — ringkasan minggu | jelek | "17.00 WIB **WIB**"; meter kesiapan memakai 6 orang padahal `SLOT_NEEDS` = 8; aksi cepat berikon "+" tapi cuma tautan; "Catat Kas"/"Ibadah Baru" tampil ke semua peran; tidak ada jalan pintas ke Papan Penatalayan | P1 |
| 5 | Ibadah: ubah / arsip / pulihkan | patah | `actions/gatherings.ts:104,143,164` tanpa cek peran dan tanpa cek jumlah baris → non-komite mendapat "berhasil" + baris audit padahal RLS menolak diam-diam (0 baris) | P0 |
| 6 | Ibadah: detail | jelek | "WIB WIB"; kartu "Catatan Penatalayan" berisi jadwal latihan **hardcode** (Rabu 19:00, Sabtu 15:00) yang tidak berasal dari data | P1 |
| 7 | Papan Penatalayan | tuntas | grid, beban, tambah per sel, undo; hapus butuh `0014` (gagal tertutup). Empty state tanpa tombol ke Ibadah | P2 |
| 8 | Kehadiran | setengah | `gatherings/[id]/page.tsx:97-108` memakai peran dari baris `profiles` → admin tanpa baris profil bisa mengubah ibadah tapi tidak melihat absensi | P1 |
| 9 | Beban pelayanan (peringatan) | patah | `data.ts:338` menyebar baris snake_case mentah ke `Profile` → `fullName` dsb. `undefined` di produksi. Copy ">3" di `members/[id]` padahal ambang 2 | P0 |
| 10 | Kas: catat / ubah / hapus | setengah | Tidak ada umpan balik sukses (modal langsung tertutup); error `type/account/category` tidak dirender; `restoreTransaction` tidak dipakai (tak ada undo hapus) | P1 |
| 11 | Kas: ekspor CSV | patah | `finance/export/route.ts` tanpa cek peran (tombol disembunyikan, URL tetap jalan); sel tidak dilindungi dari formula injection Excel (`=…`) | P0 |
| 12 | Rapat / notulen | setengah | read-only; tidak ada cara membuat notulen di UI. **Tidak dikerjakan** — fitur baru, butuh spek Dex | — |
| 13 | Audit | jelek | tampil untuk semua; non-admin melihat "Belum ada catatan" yang menyesatkan (RLS admin-only) | P1 |
| 14 | Anggota, Cross, Kelompokku | tuntas | tidak ada temuan baru yang memblokir | — |
| 15 | Kode | — | 19 `any` di `data.ts`; cek komite disalin 4×; peta status anggota disalin 2× | P2 |
| 16 | Data demo | jelek | seed memakai peran "Musik" (bukan "Pemusik") → papan menghitung Pemusik 0 | P2 |

## Dugaan yang perlu dicek Dex di DB (bukan fakta)

- Apakah ada baris `steward_assignments.role` di luar 6 peran resmi (mis. "Musik" dari impor Excel)? Kalau ada, baris itu tidak muncul di papan. Query: `select role, count(*) from steward_assignments group by role;`
- Apakah SQL "Kas hanya admin+bendahara" (28 Sep, Opsi A) sudah dijalankan? Kalau belum, ekspor tanpa cek peran = kebocoran nyata.

## Rencana eksekusi (urut)

1. P0: filter nav per peran; cek peran + cek baris di aksi ibadah; ekspor CSV dijaga + escape formula; perbaiki pemetaan beban.
2. P1: beranda (WIB, meter slot, aksi per peran, pintasan papan); absensi pakai peran sesi; antrean persetujuan kosong; umpan balik kas; audit untuk non-admin; buang kartu latihan hardcode.
3. Refactor: `lib/roles.ts` satu sumber peran; buang `any`; komponen bagian/kartu bersama.
4. Visual: satu sistem `Panel` + `SectionTitle`, cek ulang 390 px.
