# LAPORAN QC YGMS — 28 September 2026 oleh Antigravity

> **Target:** https://youth-gkkk-ms.vercel.app (commit `9b142dc`, deploy 28 Sep malam WIB)
> **Dikerjakan:** 28–29 Sep 2026 WIB, verifikasi murni (zero edit, zero write ke DB).

---

## Vonis modul (satu baris per modul)

| Modul | Vonis | Bukti |
|---|---|---|
| Landing `/` | TERBUKTI OK | HTTP 200; Nocturne gelap; hero "Youth GKKK Yogyakarta" render; 0 console error; 25/25 aset 200/304; muat <2 dtk (screenshot DevTools) |
| Login `/login` | TERBUKTI OK | HTTP 200; tombol "Lanjutkan dengan Google" render (screenshot); `<title>` = "Masuk Portal Pengurus · Youth GKKK"; `robots` = noindex nofollow |
| Gate auth (9 rute dashboard) | TERBUKTI OK | `/dashboard`, `/dashboard/gatherings`, `/members`, `/cross`, `/cross/mine`, `/finance`, `/meetings`, `/audit`, `/settings` — semua → HTTP 307 redirect ke `/login` (PowerShell `Invoke-WebRequest -MaximumRedirection 0`); navigasi DevTools `/dashboard` → URL akhir `/login` |
| `robots.txt` | TERBUKTI OK | HTTP 200; isi: `Disallow: /dashboard`, `Disallow: /login`, `Sitemap:` URL benar |
| `sitemap.xml` | TERBUKTI OK | HTTP 200; valid XML; 1 `<url>` = `https://youth-gkkk-ms.vercel.app` priority 1, changefreq weekly |
| 404 halaman ngawur | TERBUKTI OK | HTTP 404 (curl); halaman kustom "Halaman tidak ditemukan" dengan tombol "Ke halaman depan" dan "Buka dashboard" (screenshot DevTools) |
| Pesan error DB ramah (`db-errors.ts`) | TERBUKTI OK | File baru `src/lib/db-errors.ts`:48 baris, 13 kode dikenal → bahasa Indonesia, 3 pola generik (RLS/duplicate key/foreign key), fallback "Gagal menyimpan…"; semua 6 action import & gunakan `friendlyDbError()` |
| Gate tombol tulis (peran) | TERBUKTI OK | `finance/page.tsx` L73: `canManage = admin \|\| treasurer`; `gatherings/page.tsx` L58: `canManage = admin \|\| treasurer \|\| ministry`; `gatherings/[id]/page.tsx` L91: `canManage` idem; non-pengurus lihat `mode baca` banner, tombol tulis di-`{canManage && …}` |
| Anti-double-submit (penatalayan) | TERBUKTI OK | `AssignStewardForm.tsx` L27: `isPending` dari `useTransition()`; L116: `disabled={isPending}`; L119: label berubah "Menyimpan…" saat pending |
| Tombol ikon 44px | TERBUKTI OK | `TransactionRowActions.tsx` L52: class `h-11 w-11` (= 44×44px); sebelumnya `h-9 w-9` (36px) |
| Copy "ditolak" terpisah | TERBUKTI OK | `PendingApproval.tsx` L17: prop `status?: "pending" \| "rejected"`; L38: ikon ShieldX vs Clock; L43: judul "Akses Tidak Disetujui" vs "Menunggu Persetujuan Pengurus"; teks beda |
| Tombol Keluar | TERBUKTI OK | `SignOutButton.tsx`:28 baris; server action `signOut()` → `supabase.auth.signOut()` + `redirect("/")`; dipanggil di PendingApproval + Settings |
| Kartu AKUN SAYA (Settings) | TERBUKTI OK | `settings/page.tsx` L35–L69: section "AKUN SAYA"; menampilkan `session.displayName`, `session.email`, `ROLE_LABELS[session.appRole]`; tombol Keluar di bawah |
| Error login `auth` + `oauth` | TERBUKTI OK | `login/page.tsx` L114: `(error === "oauth" \|\| error === "auth")`; pesan berbeda per jenis; `auth` = "Sesi Google gagal ditukar…" |
| `getMyAccountStatus` baca `rejected` | TERBUKTI OK | `data.ts` L731: query `account_approvals.status` untuk user sendiri; return `"rejected"` kalau row ada dan status = rejected; layout.tsx meneruskan status ke PendingApproval |
| `getMySessionInfo` | TERBUKTI OK | `data.ts` L750: fungsi baru; baca `auth.getUser()` + `get_my_app_role` RPC + `account_approvals.display_name`; dipakai di Settings, Finance, Gatherings |

---

## Temuan

### 🔴 MERAH (salah / bocor / mati)

*Tidak ditemukan temuan MERAH dari §3 dan review kode.*

### 🟡 KUNING (membingungkan / rapuh / inkonsisten)

- **Tanda kurung nyasar di teks Mode Demo (audit page)**
  - Lokasi: `src/app/dashboard/audit/page.tsx` baris 25
  - Isi saat ini: `"…data contoh)."`
  - Seharusnya: `"…data contoh."` (tanpa kurung tutup sebelum titik)
  - Dampak: kosmetik, hanya muncul di mode demo (Supabase tidak terhubung), tapi membingungkan kalau dilihat. Baris ini diubah di commit `d8ced9e` — kata `(mock)` dihapus tapi kurung tutup tertinggal.
  - Reproduksi: baca `src/app/dashboard/audit/page.tsx:25`.

- **`canManage` di `gatherings/[id]/page.tsx` melibatkan dua sumber peran**
  - Lokasi: `src/app/dashboard/gatherings/[id]/page.tsx` L87–L91
  - Kode: `const role = session?.appRole ?? current?.appRole;` lalu `canManage` pakai `role`.
  - Potensi: kalau `session` null (demo) dan `current` juga null, `role` = undefined, `canManage` = true (karena `!isSupabaseConfigured()` jadi true). Ini benar untuk demo. Tapi kalau suatu saat ada kasus di mana session ada tapi appRole-nya null, tombol tulis akan tersembunyi karena `role` = null dari session, bukan fallback ke current. Rapuh, tapi saat ini aman karena `get_my_app_role` RPC selalu return string.
  - Vonis: INDIKASI (rapuh, bukan bug aktif).

### 🟢 HIJAU (diverifikasi OK — ditulis eksplisit)

- **Landing page**: Nocturne gelap, hero render, 0 console error, 25/25 network request 200/304, load <2 dtk. Title, OG meta, favicon semua benar.
- **Login page**: Tombol "Lanjutkan dengan Google" render, title benar, `noindex nofollow` sesuai.
- **Auth gate (9 rute)**: Semua 307 → `/login`. Tidak bocor satu pun.
- **404 custom page**: Branded, tidak crash, "Halaman tidak ditemukan" + dua tombol navigasi.
- **robots.txt + sitemap.xml**: Valid, URL benar, dashboard di-disallow.
- **Commit `68cf61e` (batch auth-UX)**:
  - ✅ Copy "ditolak" terpisah dari "menunggu" — `PendingApproval` sekarang menerima `status` prop.
  - ✅ Tombol Keluar — `SignOutButton.tsx` baru, server action `signOut()`.
  - ✅ Error login `auth` + `oauth` — keduanya ditangani, pesan berbeda.
  - ✅ Kartu AKUN SAYA — section baru di Settings, tampilkan nama + email + peran + tombol Keluar.
  - ✅ `getMyAccountStatus()` sekarang baca `rejected` dari `account_approvals`.
  - ✅ `getMySessionInfo()` fungsi baru untuk sesi tanpa profil.
- **Commit `d8ced9e` (batch kuning)**:
  - ✅ `db-errors.ts` — 13 error dikenal, 3 pola generik, fallback aman. Semua action (accounts, attendance, cross, finance, gatherings) sudah migrasi ke `friendlyDbError()`.
  - ✅ Gate peran Finance — `canManage` admin/treasurer; non-pengurus lihat banner "mode baca", tombol tulis + impor + aksi baris hilang.
  - ✅ Gate peran Gatherings — `canManage` admin/treasurer/ministry; tombol buat ibadah di-hide.
  - ✅ Gate peran Gathering Detail — action shelf (edit, tugaskan, arsipkan) di-hide untuk non-committee.
  - ✅ Anti-double-submit — `AssignStewardForm` pakai `isPending` + `disabled`.
  - ✅ Tombol ikon 44px — `TransactionRowActions` `h-11 w-11` (sebelumnya `h-9 w-9`).
  - ✅ Label "Fatigue Alert" diganti bahasa Indonesia "Perhatian Beban Pelayanan".
  - ✅ Label "Bypass (Demo Mode)" diganti "Tanpa Login (Mode Demo)".
  - ✅ ERROR_MESSAGES lokal di `cross.ts` dihapus, pindah ke `db-errors.ts` terpusat.

---

## Misteri M1/M2/M3

### M1: Trigger ganda `check_event_pic`

**Vonis: BELUM-BISA-DIUJI**

Alasan: Query M1 membutuhkan akses SQL Editor Supabase (project `rbouxffjcqjwywyhbtqw`). Saya tidak memiliki kredensial Supabase dan tidak boleh memintanya (§0 aturan 6). Dex perlu menjalankan query ini sendiri:

```sql
SELECT 'attendance_rows' AS cek, count(*)::text AS hasil FROM public.attendance
UNION ALL
SELECT 'functions_0012_0013', count(*)::text FROM pg_proc WHERE proname IN ('mark_attendance','is_pic_eligible','list_pic_eligible','check_event_pic')
UNION ALL
SELECT 'trigger_di_' || event_object_table, trigger_name FROM information_schema.triggers WHERE trigger_name = 'check_event_pic';
```

### M2: Policy INSERT `steward_assignments`

**Vonis: BELUM-BISA-DIUJI**

Alasan: Sama — butuh akses SQL Editor. Query yang perlu dijalankan:

```sql
SELECT policyname, cmd FROM pg_policies
WHERE tablename = 'steward_assignments' AND cmd = 'INSERT';
```

Harapan: 1 baris "Committee can insert steward assignments" / INSERT.

### M3: Pengetatan kas `finance_transactions`

**Vonis: BELUM-BISA-DIUJI**

Alasan: Sama — butuh akses SQL Editor. Query yang perlu dijalankan:

```sql
SELECT policyname, cmd FROM pg_policies
WHERE tablename = 'finance_transactions' AND cmd = 'SELECT';
```

Harapan: 1 baris "…admin and treasurer". Kalau masih ada "Finance readable by approved accounts": pengetatan GAGAL.

---

## Skrip klik Dex

> Instruksi langkah-langkah untuk Dex (admin) — jalankan di browser, ~10 menit.
> Tiap langkah: **aksi → hasil harapan → kalau gagal artinya apa.**

### 1. Login Google

- **Aksi:** Buka https://youth-gkkk-ms.vercel.app/login → klik "Lanjutkan dengan Google" → pilih akun Dex.
- **Harapan:** Masuk `/dashboard`, bukan mental balik ke `/login`. Dashboard menampilkan ringkasan (ibadah, anggota, keuangan).
- **Kalau gagal:** Auth callback rusak, atau akun belum di-approve (cek `account_approvals` di Supabase).

### 2. Pengaturan — Kartu AKUN SAYA

- **Aksi:** Klik menu "Pengaturan" di sidebar.
- **Harapan:** Ada kartu berlabel **( AKUN SAYA )** yang menampilkan:
  - "Masuk Sebagai" = nama + email Dex
  - "Peran" = "Pengurus Inti (Admin)"
  - Tombol "Keluar" di bawah kartu
- **Kalau gagal:** `getMySessionInfo()` gagal baca sesi atau `get_my_app_role` RPC error. Cek console Vercel.

### 3. Ibadah — Tugaskan Penatalayan

- **Aksi:** Klik menu "Ibadah" → buka detail satu ibadah → klik tombol "Tugaskan Penatalayan" → pilih 1 peran dari dropdown (misal "WL") + pilih 1 anggota → klik "Simpan Penugasan".
- **Harapan:** Nama anggota muncul di daftar penatalayan ibadah itu. Tombol berubah jadi "Menyimpan…" saat proses, lalu kembali normal.
- **Kalau gagal:**
  - Kalau tombol "Tugaskan Penatalayan" tidak ada → `canManage` salah baca peran (cek `getMySessionInfo`).
  - Kalau error "Akses ditolak database" → policy INSERT `steward_assignments` belum dibuat (M2).

### 4. Double-submit check

- **Aksi:** Buka detail ibadah lain → klik "Tugaskan Penatalayan" → isi peran + anggota → klik "Simpan Penugasan" 2× cepat (klik-klik).
- **Harapan:** Hanya 1 baris ditambahkan. Klik kedua ter-disable (tombol disabled saat pending).
- **Kalau gagal:** `isPending` dari `useTransition()` tidak terpasang benar, atau race condition di server action. Cek ada baris duplikat di tabel `steward_assignments`.

### 5. Keuangan — CRUD transaksi

- **Aksi:**
  1. Klik "Kas Keuangan" → klik "Catat Transaksi" → isi (misal: Pemasukan Rp 1.000, kategori Persembahan, akun Kas).
  2. Simpan → cek saldo Pemasukan bertambah Rp 1.000.
  3. Klik ikon edit di baris tadi → ubah nominal jadi Rp 2.000 → simpan → cek saldo berubah.
  4. Klik ikon hapus → konfirmasi → cek baris hilang + saldo berkurang.
  5. Scroll ke bawah, kalau ada daftar "dihapus" → klik Pulihkan → cek baris muncul lagi + saldo kembali.
- **Harapan:** Saldo realtime berubah benar tiap langkah. Semua pesan error (kalau ada) dalam bahasa Indonesia.
- **Kalau gagal:** Cek policy SELECT `finance_transactions` (M3) — kalau pengetatan aktif tapi admin tidak termasuk, data tidak muncul.

### 6. Cross + QuickAdd anggota tes

- **Aksi:**
  1. Klik "Kelompok Cross" → klaim salah satu kelompok (kalau belum) dengan kode akses.
  2. Buka kelompok → klik "Tambah Anggota" → isi nama "TES HAPUS" → simpan.
  3. Cek nama "TES HAPUS" muncul di daftar.
- **Harapan:** Berhasil, pesan ramah kalau error (misal "Nama terlalu panjang" kalau >80 karakter).
- **Kalau gagal:** RPC `add_cross_member` error — cek pesan di layar (sudah pakai `friendlyDbError`).
- **Setelah selesai:** Kabari supaya data tes dibersihkan.

### 7. Kehadiran — centang + refresh

- **Aksi:** Klik "Ibadah" → buka detail → scroll ke daftar kehadiran → centang 1 nama → refresh halaman (F5).
- **Harapan:** Centang bertahan setelah refresh (data tersimpan via `mark_attendance` RPC + RLS).
- **Kalau gagal:** RPC atau RLS kehadiran bermasalah. Cek error di console.

### 8. Toggle tema terang/gelap

- **Aksi:**
  1. Di dashboard, cari toggle tema (biasanya di header/sidebar) → klik ke "Light Mode".
  2. Cek: semua kartu terbaca? Ada teks hilang atau kontras jelek?
  3. Klik kembali ke "Dark Mode".
  4. Ulangi di HP (resize browser ke ~375px atau buka dari HP langsung).
- **Harapan:** Semua elemen terbaca di kedua mode, tidak ada teks hilang.
- **Kalau gagal:** Catat elemen mana yang bermasalah + screenshot. Ini masalah desain Nocturne, bukan crash.

### 9. (Opsional) Uji pembanding peran

- **Aksi:** Kalau bisa, pinjam HP pengurus non-bendahara (misal pemimpin Cross) → login → buka halaman Keuangan.
- **Harapan:** Muncul banner "Kamu melihat mode baca — pencatatan kas hanya untuk bendahara dan admin." + tombol tulis/impor hilang.
- **Kalau gagal:** `canManage` salah membaca peran pemimpin Cross sebagai bendahara/admin.

---

## Yang BELUM-BISA-DIUJI + kenapa

| Item | Alasan |
|---|---|
| M1: trigger ganda `check_event_pic` | Butuh akses SQL Editor Supabase (query `pg_proc` + `information_schema.triggers`). Tidak punya kredensial. |
| M2: policy INSERT `steward_assignments` | Sama — butuh SQL Editor. |
| M3: pengetatan SELECT `finance_transactions` | Sama — butuh SQL Editor. |
| Flow login end-to-end | Butuh klik Google OAuth secara langsung (skrip klik §4 sudah ditulis untuk Dex). |
| Fitur ibadah/keuangan/cross/kehadiran secara live | Butuh sesi terautentikasi. Skrip klik §4 mencakup semua ini. |
| Toggle tema terang/gelap di HP fisik | Butuh perangkat fisik atau sesi terautentikasi. |
| Peran non-admin (pembanding bendahara vs member) | Butuh login dengan akun peran berbeda. |

---

> **Catatan akhir:** Dari sisi kode dan respons HTTP live, website dalam kondisi **sehat**. Semua klaim batch `68cf61e` dan `d8ced9e` (copy ditolak, tombol keluar, gate peran, pesan ramah, anti-double-submit, 44px) **terbukti benar di kode**. Satu temuan KUNING (kurung nyasar di audit page) bersifat kosmetik. Tiga misteri DB (M1/M2/M3) menunggu Dex jalankan query di SQL Editor.
