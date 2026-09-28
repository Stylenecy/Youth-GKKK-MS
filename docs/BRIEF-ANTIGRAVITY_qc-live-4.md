> ⏱️ **Ditulis 28 September 2026, sore WIB** oleh OpenCode (sesi Dex), setelah 2 putaran
> audit + 3 deploy produksi dalam sehari. Semua angka di brief ini **diukur, bukan ditebak**.
> Misi kamu kali ini BUKAN nulis kode — melainkan **QC + audit + testing langsung ke
> website live**. Temuanmu menentukan apa yang dikerjakan sesi berikutnya.

# BRIEF ANTIGRAVITY — QC & audit independen website YGMS live (putaran 4)

**Untuk:** Antigravity
**Dari:** OpenCode (sesi Dex, 28 Sep 2026)
**Target:** https://youth-gkkk-ms.vercel.app (production = commit `9b142dc`, deploy 28 Sep malam WIB)

---

## 0. ATURAN MUTLAK — melanggar satu = laporanmu ditolak seluruhnya

Setiap aturan di bawah ada karena sudah pernah dilanggar di proyek ini.

1. **DILARANG MENGUBAH KODE.** Misi ini verifikasi murni. Jangan edit, jangan commit,
   jangan push, jangan deploy. Temuan → tulis di laporan (§6), bukan di codebase.
2. **DILARANG MENULIS KE DATABASE.** Read-only. Boleh `SELECT` + query katalog
   (`pg_policies`, `information_schema`). Dilarang `INSERT/UPDATE/DELETE/DDL` dalam
   bentuk apa pun — termasuk "coba-coba satu baris lalu hapus". Data ini milik jemaat.
3. **DILARANG MENGAKU TANPA BUKTI.** Setiap vonis wajib bukti yang kamu jalankan
   sendiri: kode status HTTP, baris hasil query, potongan layar, atau path:line kode.
   *(Preseden: laporan "SIAP PRODUKSI" 19 Ags ternyata 43 berkas belum di-commit.)*
4. **DILARANG memasukkan data pribadi jemaat** (nama lengkap, tanggal lahir, nomor HP,
   email) ke laporan atau file apa pun. Tulis "1 baris cocok", "anggota C3", bukan namanya.
5. **DILARANG menyentuh desain "Nocturne".** Bukan misi kamu. Kalau nemu masalah visual,
   laporkan (lokasi + screenshot + rasio kontras kalau relevan), jangan perbaiki.
6. **DILARANG commit secret.** Tidak ada kredensial di brief ini dan tidak boleh ada di
   laporanmu. Login Google pengujian hanya bisa dilakukan Dex sendiri (§4).
7. **Kalau tidak yakin, katakan tidak yakin.** Ketidakpastian yang jujur lebih berguna
   daripada kepastian yang salah. Tandai vonis: TERBUKTI / INDIKASI / BELUM-BISA-DIUJI.

---

## 1. Konteks singkat

Sistem manajemen pelayanan **Komisi Pemuda GKKK Yogyakarta** — ganti spreadsheet.

- **Live:** https://youth-gkkk-ms.vercel.app (commit `9b142dc`, deploy 28 Sep 2026 malam)
- **Stack:** Next.js 16.2.9 (App Router, Turbopack) + Supabase (PostgreSQL + Google OAuth) + Vercel
- **Repo:** `Stylenecy/Youth-GKKK-MS`, branch `master`, private. HEAD saat brief ditulis: `7d74dc8`
  (catatan docs; kode sama dengan yang live). Auto-deploy GitHub↔Vercel **mati by design** —
  deploy hanya via CLI oleh sesi yang diminta Dex.
- **Supabase HIDUP, data asli masuk.** Project `rbouxffjcqjwywyhbtqw`. Bukan mode demo.
- **Desain "Nocturne" final** (gelap; dashboard punya toggle Light Mode, landing terkunci gelap).

### Yang berubah HARI INI (fokus QC-mu di sini)

| Waktu | Isi | Commit |
|---|---|---|
| Pagi | Batch auth-UX: copy "ditolak" terpisah dari "menunggu", tombol Keluar, error login `auth`+`oauth`, kartu AKUN SAYA di settings | `68cf61e` |
| Sore | Batch kuning: pesan error DB ramah Indonesia (`src/lib/db-errors.ts`), tombol tulis digate peran, anti-double-submit, tombol ikon 44px | `d8ced9e` |
| Sore | 2 policy DB oleh Dex via SQL Editor: INSERT `steward_assignments` untuk committee + SELECT `finance_transactions` diketatkan ke admin+bendahara | — (DB, bukan git) |

### Yang sudah diaudit hari ini (jangan ulangi — verifikasi independen saja)

- Putaran 1 (3 agen, baca kode): flow ibadah, penatalayan, PIC, absensi, cross, anggota, WA,
  keuangan, rapat, audit, settings, tema → vonis inti OK, 4 cacat kecil (sudah diperbaiki).
- Putaran 2 (3 agen + cek bukti): keamanan RLS-vs-UI, regresi batch auth-UX (7/7 OK),
  kelengkapan UX. Menemukan 2 MERAH DB (sudah jadi 2 policy di atas) + 1 klaim agen yang
  SALAH (tombol Ekspor dituduh 404 — file-nya ada, `export/route.ts`).
- Produksi dicek tiap deploy: `/` 200, `/login` 200, 9 rute dashboard → login, sitemap/robots
  200, ngawur 404. Lokal: `tsc` bersih, 116/116 tes, build hijau.

---

## 2. Misi: apa yang harus kamu lakukan

**Verifikasi independen** bahwa website live benar-benar berfungsi end-to-end, dengan fokus
pada yang berubah hari ini. Urutan kerja:

1. **§3 — cek tanpa login** (bisa langsung): 14 rute + gate auth + halaman statis.
2. **§5 — verifikasi DB read-only** (butuh akses baca Supabase Dex; kalau tidak diberi,
   tandai BELUM-BISA-DIUJI dan lanjut): 3 misteri terbuka.
3. **Review kode batch hari ini** (`68cf61e`, `d8ced9e` via `git show`): apakah klaim
   "fail-closed", "gate peran", "pesan ramah" benar di kode? Cari yang terlewat.
4. **§4 — tulis skrip klik untuk Dex** (10 menit, bahasa Indonesia santai): flow login yang
   HANYA Dex bisa lakukan. Jangan mengarang hasil — tulis langkah + hasil yang diharapkan.
5. **§6 — laporan temuan** dengan format yang diminta.

---

## 3. Cek tanpa login (kerjakan dulu, tanpa butuh siapa pun)

| # | Rute | Harapan |
|---|---|---|
| 1 | `/` | 200, konten Nocturne, tanpa error console |
| 2 | `/login` | 200, tombol "Lanjutkan dengan Google" render |
| 3–11 | `/dashboard`, `/dashboard/gatherings`, `/members`, `/cross`, `/cross/mine`, `/finance`, `/meetings`, `/audit`, `/settings` | dialihkan ke halaman login (gate jalan, tidak bocor) |
| 12–13 | `/robots.txt`, `/sitemap.xml` | 200 |
| 14 | URL ngawur | 404 halaman sendiri (bukan crash) |

Catat juga: waktu muat halaman depan (kasar, cukup "terasa <2 dtk / lambat"), dan apakah
ada aset 404 di console.

---

## 4. Skrip klik untuk Dex (kamu tulis, Dex jalankan)

Buat daftar langkah bernomor, tiap langkah: **aksi → hasil yang diharapkan → kalau gagal
artinya apa**. Cakup (sesuaikan dengan peran akun Dex = admin):

1. Login Google → harus masuk `/dashboard`, bukan mental ke login lagi.
2. Pengaturan → kartu **AKUN SAYA** tampil (nama + email + "Pengurus Inti (Admin)") + tombol Keluar ada. (BARU hari ini — konfirmasi live.)
3. Ibadah → buka satu detail → tombol "Tugaskan Penatalayan" ada (tadi tanpa policy INSERT pasti gagal; sekarang harus sukses) → isi 1 peran + 1 anggota → nama muncul di daftar. (BARU: policy + anti-double-submit.)
4. Coba klik Simpan 2× cepat → harus 1 baris (cek tidak dobel).
5. Keuangan → catat 1 transaksi kecil → ubah → hapus → pulihkan (soft delete). Cek saldo berubah benar tiap langkah.
6. Klaim/kelola Cross + QuickAdd 1 anggota tes (nama jelas tes, mis. "TES HAPUS") → lalu kabari untuk dibersihkan.
7. Kehadiran: centang 1 nama → refresh → centang bertahan (bukti RPC + RLS jalan).
8. Toggle terang/gelap di HP + desktop → semua kartu terbaca, tidak ada teks hilang.
9. Sebagai pembanding peran (kalau sempat pinjam HP pengurus non-bendahara): halaman Keuangan menampilkan banner mode-baca + tombol tulis hilang. (BARU hari ini.)

---

## 5. Verifikasi DB read-only (3 misteri terbuka — prioritas tertinggi)

Jalankan di Supabase SQL Editor. **Hanya query di bawah. Tidak ada yang lain.**

```sql
-- M1: misteri trigger ganda. Kode (0013) cuma bikin SATU trigger di events,
-- tapi screenshot Dex menunjukkan DUA baris check_event_pic. Harusnya 3 baris:
-- attendance_rows, functions_0012_0013 = 4, trigger_di_events = 1.
SELECT 'attendance_rows' AS cek, count(*)::text AS hasil FROM public.attendance
UNION ALL
SELECT 'functions_0012_0013', count(*)::text FROM pg_proc WHERE proname IN ('mark_attendance','is_pic_eligible','list_pic_eligible','check_event_pic')
UNION ALL
SELECT 'trigger_di_' || event_object_table, trigger_name FROM information_schema.triggers WHERE trigger_name = 'check_event_pic';
-- Kalau trigger muncul 2 baris beda tabel: laporkan NAMA TABELNYA. Jangan hapus apa pun.
```

```sql
-- M2: policy INSERT penatalayan (dibuat Dex 28 Sep sore). Harus ada 1 baris.
SELECT policyname, cmd FROM pg_policies
WHERE tablename = 'steward_assignments' AND cmd = 'INSERT';
-- Harapan: "Committee can insert steward assignments" / INSERT. Kalau kosong: fitur mati.
```

```sql
-- M3: pengetatan kas (dibuat Dex 28 Sep sore, Opsi A: admin+bendahara).
SELECT policyname, cmd FROM pg_policies
WHERE tablename = 'finance_transactions' AND cmd = 'SELECT';
-- Harapan: SATU baris "...admin and treasurer". Kalau masih ada
-- "Finance readable by approved accounts": pengetatan GAGAL, laporkan MERAH.
```

---

## 6. Format laporan (wajib seperti ini)

```markdown
# LAPORAN QC YGMS — [tanggal] oleh Antigravity

## Vonis modul (satu baris per modul)
| Modul | Vonis | Bukti |
|---|---|---|
| Gate auth tanpa login | TERBUKTI OK | 9 rute → login (screenshot/log) |
| ... | ... | ... |

## Temuan
### 🔴 MERAH (salah / bocor / mati)
- [judul]: lokasi, langkah reproduksi, bukti, dampak. Satu temuan satu blok.
### 🟡 KUNING (membingungkan / rapuh / inkonsisten)
- ...
### 🟢 HIJAU (diverifikasi OK — tulis eksplisit, jangan diam)
- ...

## Misteri M1/M2/M3
- Hasil query + vonis masing-masing.

## Skrip klik Dex
- (lihat §4 — tulis hasil final di sini)

## Yang BELUM-BISA-DIUJI + kenapa
- ...
```

**Bukan tugasmu (sudah diputuskan sesi lain, jangan sentuh, jangan nilai ulang):**
model identitas login↔roster (opsi a/b/c di `0007`, ranah Dex), CRUD notulen + ubah/hapus
penatalayan (fitur baru, butuh spek Dex), `*.txt` tidak di-ignore (sengaja), dead code
`auth.ts`/`updateEventStatus` (rina, tak berdampak).

---

## 7. Definisi selesai

- §3 tuntas dengan bukti per baris.
- M1/M2/M3 terjawab (atau BELUM-BISA-DIUJI dengan alasan akses yang jelas).
- Review `68cf61e` + `d8ced9e`: konfirmasi atau bantah klaim "fail-closed / gate peran /
  pesan ramah" — dengan path:line.
- §4 skrip klik siap dipakai Dex apa adanya.
- Laporan §6 ditulis sebagai file `docs/LAPORAN-QC_2026-09-28_antigravity.md` (boleh buat
  file INI saja — satu-satunya file yang boleh kamu tulis).
