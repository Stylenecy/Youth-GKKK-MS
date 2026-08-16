# PANDUAN DETAIL — Sambungkan Supabase & Import Data YGMS

> **Tanggal:** 11 Agustus 2026
> **Dari:** AI Pelaksana
> **Untuk:** Dex

Panduan ini menjelaskan setiap langkah secara detail — apa yang diklik, apa yang dilihat, dan apa yang harus muncul. Ikuti berurutan, jangan loncat.

---

## SEBELUM MULAI: Yang Harus Disiapkan

Sebelum mulai, pastikan kamu punya:

1. **Akun Google** yang bisa akses:
   - Supabase Dashboard (https://supabase.com/dashboard)
   - Vercel Dashboard (https://vercel.com/dashboard)
   - Google Cloud Console (https://console.cloud.google.com)

2. **Email Nathan** — kamu tahu email Google Nathan yang dipakai untuk login

3. **Email kamu sendiri** — email Google yang kamu pakai (untuk jadi admin)

4. **Waktu** — kurang lebih 30-45 menit untuk semua langkah

---

## FASE 1: SUPABASE — Database & Auth

### LANGKAH 1: Jalankan Migrasi Database

**Apa ini:** Membuat semua tabel (profiles, events, crosses, dll) dan fungsi di database Supabase.

**Detail langkah:**

1. **Buka Supabase SQL Editor**
   - Buka browser, pergi ke: https://supabase.com/dashboard/project/rbouxffjcqjwywyhbtqw/sql/new
   - Atau: Dashboard → kiri bawah ada ikon "SQL" → New Query

2. **Jalankan schema.sql**
   - Buka file `supabase/schema.sql` di repo (buka di VS Code atau Notepad)
   - Select All (Ctrl+A) → Copy (Ctrl+C)
   - Kembali ke browser, paste di SQL Editor (Ctrl+V)
   - Klik tombol **Run** (atau Ctrl+Enter)
   - Tunggu sampai muncul "Success. No rows returned"

3. **Jalankan migrasi 0002**
   - Buka file `supabase/migrations/0002_soft_delete_finance.sql`
   - Copy seluruh isinya
   - Kembali ke SQL Editor, paste, klik Run
   - Tunggu "Success"

4. **Jalankan migrasi 0003**
   - Buka file `supabase/migrations/0003_cross_leadership_and_rls_gaps.sql`
   - Copy, paste di SQL Editor, Run

5. **Jalankan migrasi 0004**
   - Buka file `supabase/migrations/0004_leadership_rpcs.sql`
   - Copy, paste, Run

6. **Jalankan migrasi 0005**
   - Buka file `supabase/migrations/0005_finance_absorbs_kas_nathan.sql`
   - Copy, paste, Run

**Verifikasi — jalankan query ini:**
```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' ORDER BY table_name;
```

**Yang harus muncul:**
```
admin_emails
audit_logs
cross_claim_codes
cross_memberships
crosses
events
finance_transactions
meeting_notes
monthly_themes
profiles
skills
steward_assignments
treasurer_emails
```

Kalau muncul 13 tabel di atas → **LANJUTKAN**.
Kalau ada yang kurang → ulangi langkah yang gagal.

---

### LANGKAH 2: Tambah Email Nathan sebagai Bendahara

**Apa ini:** Memberi Nathan akses ke fitur keuangan (tambah transaksi, export CSV, lihat saldo).

**Detail langkah:**

1. **Buka SQL Editor** (https://supabase.com/dashboard/project/rbouxffjcqjwywyhbtqw/sql/new)

2. **Jalankan query ini** (GANTI email Nathan dulu):
```sql
INSERT INTO public.treasurer_emails (email)
VALUES ('EMAIL_NATHAN')  -- GANTI DENGAN EMAIL ASLI NATHAN
ON CONFLICT DO NOTHING;
```

3. **Klik Run**

**Verifikasi:**
```sql
SELECT * FROM public.treasurer_emails;
```

**Yang harus muncul:** 1 baris dengan email Nathan.

---

### LANGKAH 3: Tambah Email Dex sebagai Admin

**Apa ini:** Memberi kamu (Dex) akses penuh ke semua fitur admin.

**Detail langkah:**

1. **Buka SQL Editor**

2. **Jalankan query ini** (GANTI email kamu):
```sql
INSERT INTO public.admin_emails (email)
VALUES ('EMAIL_KAMU')  -- GANTI DENGAN EMAIL ASLI KAMU
ON CONFLICT DO NOTHING;
```

3. **Klik Run**

**Verifikasi:**
```sql
SELECT * FROM public.admin_emails;
```

**Yang harus muncul:** 1 baris dengan email kamu.

---

### LANGKAH 4: Aktifkan Google OAuth

**Apa ini:** Supaya pengurus bisa login pakai akun Google.

**Detail langkah:**

1. **Buka Supabase Dashboard**
   - Kiri atas: klik project `rbouxffjcqjwywyhbtqw`

2. **Buka halaman Providers**
   - Kiri sidebar: Authentication → Providers
   - Scroll ke bawah sampai ketemu "Google"

3. **Enable Google**
   - Klik **Google** untuk expand
   - Toggle **Enable** ke ON (biru)

4. **Isi Client ID dan Client Secret**
   - Jika sudah punya: langsung masukkan
   - Jika belum punya: ikuti sub-langkah di bawah

**Sub-langkah: Dapatkan Google OAuth Credentials (jika belum punya)**

1. Buka https://console.cloud.google.com/apis/credentials
2. Login dengan akun Google kamu
3. Klik **Create Credentials** → **OAuth 2.0 Client ID**
4. Jika diminta configure OAuth consent screen:
   - Pilih **External**
   - Isi nama aplikasi: "YGMS - Youth GKKK Management"
   - Email support: email kamu
   - Save & Continue sampai selesai
5. Kembali ke Create Credentials → OAuth 2.0 Client ID
6. Application type: **Web application**
7. Name: "YGMS Production"
8. Authorized redirect URIs: tambahkan:
   ```
   https://rbouxffjcqjwywyhbtqw.supabase.co/auth/v1/callback
   ```
9. Klik **Create**
10. Copy **Client ID** dan **Client Secret** yang muncul — JANGAN tempel nilai aslinya di sini atau file mana pun yang ter-commit. Simpan di Bitwarden (lihat rencana Vault-mu di `NOW.md`), lalu paste langsung dari sana ke Supabase.

5. **Kembali ke Supabase Providers**
   - Paste Client ID di kolom "Client ID"
   - Paste Client Secret di kolom "Client Secret"
   - Klik **Save**

**Verifikasi:**
- Buka kembali Authentication → Providers
- Google harusnya menunjukkan status **Enabled** dengan toggle biru

---

## FASE 2: VERCEL — Environment Variables & Deploy

### LANGKAH 5: Pasang Environment Variables

**Apa ini:** Memberi tahu aplikasi YGMS di mana database Supabase berada.

**Detail langkah:**

1. **Dapatkan Anon Key dari Supabase**
   - Buka Supabase Dashboard → Project Settings (ikon gear kiri bawah)
   - Klik **API** di sidebar
   - Di bagian "Project API keys", copy **anon** **public** key
   - Key ini panjang (mulai `eyJhbGci...`) — paste langsung ke Vercel di Langkah berikutnya, jangan disimpan di file lain

2. **Buka Vercel Environment Variables**
   - Buka https://vercel.com/dashboard
   - Pilih project `youth-gkkk-ms`
   - Klik tab **Settings** di atas
   - Klik **Environment Variables** di sidebar kiri

3. **Tambah variabel pertama**
   - Klik tombol **Add New** (pojok kanan atas)
   - Name: `NEXT_PUBLIC_SUPABASE_URL`
   - Value: `https://rbouxffjcqjwywyhbtqw.supabase.co`
   - Environments: centang **Production**, **Preview**, **Development**
   - Klik **Save**

4. **Tambah variabel kedua**
   - Klik **Add New** lagi
   - Name: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Value: (paste anon key yang tadi di-copy dari Supabase)
   - Environments: centang **Production**, **Preview**, **Development**
   - Klik **Save**

**Verifikasi:**
- Di halaman Environment Variables, harusnya ada 2 variabel baru terlihat
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY

---

### LANGKAH 6: Redeploy Aplikasi

**Apa ini:** Menjalankan ulang deploy di Vercel supaya aplikasi pakai env vars yang baru.

**Detail langkah:**

1. **Buka Vercel Dashboard**
   - Pilih project `youth-gkkk-ms`
   - Klik tab **Deployments** di atas

2. **Redeploy**
   - Di deployment terbaru (paling atas), klik "..." (tiga titik) di kanan
   - Pilih **Redeploy** dari dropdown
   - Atau: klik deployment → klik "..." di kanan atas → Redeploy

3. **Tunggu deploy selesai**
   - Status berubah dari "Building" → "Ready"
   - Biasanya 1-2 menit

**Verifikasi:**
- Buka https://youth-gkkk-ms.vercel.app/login
- Harusnya muncul halaman "Masuk ke dashboard" dengan tombol "Lanjutkan dengan Google"
- Klik tombol tersebut → harusnya redirect ke halaman login Google (bukan error page)

Kalau muncul error "supabaseUrl is required" → env vars belum ter-set dengan benar. Ulangi Langkah 5.

---

## FASE 3: IMPORT DATA

### LANGKAH 7: Jalankan SQL Data di Supabase

**Apa ini:** Memasukkan data 92 anggota, 5 Cross, 29 ibadah, dan transaksi keuangan ke database.

**Detail langkah:**

1. **Buka Supabase SQL Editor**
   - https://supabase.com/dashboard/project/rbouxffjcqjwywyhbtqw/sql/new

2. **Copy file SQL gabungan**
   - Buka file `scripts/import/output/00_all.sql` di repo
   - Select All (Ctrl+A) → Copy (Ctrl+C)
   - File ini besar (~120 KB), pastikan ter-copy semua

3. **Paste di SQL Editor**
   - Paste (Ctrl+V) di SQL Editor
   - Klik **Run** (atau Ctrl+Enter)
   - Tunggu sampai selesai (mungkin 10-30 detik)

**Jika terlalu besar/error, jalankan per bagian:**

1. Buka file `scripts/import/output/members.sql` → copy → paste → Run
2. Buka file `scripts/import/output/cross.sql` → copy → paste → Run
3. Buka file `scripts/import/output/finance.sql` → copy → paste → Run
4. Buka file `scripts/import/output/events.sql` → copy → paste → Run

**Verifikasi — jalankan query ini satu per satu:**

```sql
-- 1. Cek jumlah anggota
SELECT count(*) AS total_profiles FROM public.profiles;
```
**Harusnya:** `92`

```sql
-- 2. Cek Cross groups
SELECT count(*) AS total_crosses FROM public.crosses;
```
**Harusnya:** `5`

```sql
-- 3. Cek memberships
SELECT count(*) AS total_memberships FROM public.cross_memberships;
```
**Harusnya:** `44` (5 leaders + 39 members)

```sql
-- 4. Cek events
SELECT count(*) AS total_events FROM public.events;
```
**Harusnya:** `29`

```sql
-- 5. Cek transaksi keuangan
SELECT count(*) AS total_finance FROM public.finance_transactions;
```
**Harusnya:** `5`

```sql
-- 6. Cek sample data anggota
SELECT id, full_name, nickname, status FROM public.profiles LIMIT 5;
```
**Harusnya:** muncul 5 baris dengan data anggota

```sql
-- 7. Cek sample data Cross
SELECT id, name, meeting_day, meeting_time FROM public.crosses;
```
**Harusnya:** muncul 5 baris Cross 1-5

Jika semua verifikasi cocok → **LANJUTKAN KE FASE 4**.
Jika ada yang tidak cocok → laporkan ke AI untuk dibantu debug.

---

## FASE 4: VERIFIKASI LOGIN & ROLES

### LANGKAH 8: Test Login dengan Akun Dex

**Detail langkah:**

1. **Buka halaman login**
   - https://youth-gkkk-ms.vercel.app/login

2. **Klik "Lanjutkan dengan Google"**
   - Pilih akun Google kamu (Dex)
   - Jika diminta izin, klik "Allow"

3. **Harusnya redirect ke /dashboard**
   - URL berubah ke `/dashboard`
   - Muncul halaman dashboard dengan statistik

**Jika gagal:**
- "supabaseUrl is required" → env vars belum benar (ulangi Langkah 5)
- "Invalid login credentials" → email belum terdaftar di admin_emails (ulangi Langkah 3)
- Redirect loop → clear cookies, coba lagi

---

### LANGKAH 9: Verifikasi Role Admin

**Detail langkah:**

1. **Setelah login sebagai Dex, buka /dashboard/settings**
   - Harusnya menunjukkan role **admin**

2. **Buka /dashboard/cross**
   - Harusnya muncul 5 Cross groups
   - Bisa lihat semua kelompok

3. **Buka /dashboard/members**
   - Harusnya muncul 92 anggota

4. **Buka /dashboard/finance**
   - Harusnya bisa lihat transaksi dan tambah transaksi baru

---

### LANGKAH 10: Verifikasi Role Bendahara (Nathan)

**Detail langkah:**

1. **Logout**
   - Klik avatar/profile di pojok kanan atas → Logout
   - Atau: buka `/login` lagi

2. **Login dengan akun Nathan**
   - Klik "Lanjutkan dengan Google"
   - Pilih akun Nathan

3. **Buka /dashboard/finance**
   - Harusnya bisa akses fitur keuangan
   - Bisa tambah transaksi, export CSV

4. **Buka /dashboard/cross/mine**
   - Harusnya hanya bisa lihat Cross Nathan (Cross 4)

---

### LANGKAH 11: Verifikasi Role Leader Biasa

**Detail langkah:**

1. **Logout, login dengan akun salah satu Cross Leader**
   - Misal: Erica (Cross 1), Wangke (Cross 2), dll

2. **Buka /dashboard/cross/mine**
   - Harusnya hanya bisa kelola Cross-nya sendiri
   - Bisa tambah anggota ke Cross-nya

3. **Coba buka /dashboard/admin (jika ada)**
   - Harusnya tidak bisa akses (bukan admin)

---

## FASE 5: PILOT

### LANGKAH 12: Publikasikan ke Dex & Angel

**Detail langkah:**

1. **Bagikan URL ke Angel**
   - Kirim: https://youth-gkkk-ms.vercel.app
   - Minta Angel login dan coba fitur-fitur dasar

2. **Minta Angel isi data anggotanya**
   - Buka `/dashboard/cross/mine`
   - Tambah anggota Cross 5 (Cross Angel) satu per satu

3. **Awasi selama 1-2 minggu**
   - Apakah ada error?
   - Apakah ada fitur yang tidak berfungsi?
   - Apakah ada data yang tidak masuk akal?

---

### LANGKAH 13: Evaluasi & Putuskan

Setelah 1-2 minggu pilot:

1. **Evaluasi bersama Angel:**
   - Apakah sistem membantu?
   - Apakah ada bug?
   - Apakah ada fitur yang kurang?

2. **Putuskan:**
   - Siap publikasikan ke 8 Cross Leader? → lanjut
   - Masih ada masalah? → perbaiki dulu

---

## TROUBLESHOOTING

| Gejala | Penyebab | Solusi |
|--------|----------|--------|
| "supabaseUrl is required" | Env vars belum ter-set | Ulangi Langkah 5 & 6 |
| "Invalid login credentials" | Email belum di admin_emails/treasurer_emails | Ulangi Langkah 2 & 3 |
| "new row violates RLS policy" | Belum login atau RLS belum jalan | Login dulu, cek Langkah 1 |
| "function does not exist" | Migrasi belum dijalankan | Ulangi Langkah 1 |
| Data tidak muncul setelah import | Import gagal sebagian | Cek verifikasi Langkah 7, ulangi yang gagal |
| Redirect loop saat login | Cookie bermasalah | Clear cache & cookies, coba lagi |
| "User not found" saat login | Email tidak ada di auth.users | Pastikan email sudah ditambahkan di Langkah 2/3 |

---

## KONTAK BANTUAN

Jika ada masalah yang tidak terselesaikan:
1. Cek pesan error yang muncul
2. Screenshot error tersebut
3. Laporkan ke AI dengan menyertakan:
   - Langkah ke-berapa
   - Pesan error lengkap
   - Screenshot (jika ada)
