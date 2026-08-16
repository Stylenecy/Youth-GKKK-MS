# CHECKLIST DEX — Langkah-Langkah Pelaksanaan

> **Tanggal:** 11 Agustus 2026
> **Dari:** AI Pelaksana
> **Untuk:** Dex

Checklist ini berurutan. Setiap langkah harus selesai sebelum lanjut ke langkah berikutnya. Tanda `[V]` kalau sudah selesai.

---

## FASE 1: Supabase (butuh akses dashboard Supabase)

### Langkah 1: Jalankan Migrasi Database

- [ ] Buka https://supabase.com/dashboard/project/rbouxffjcqjwywyhbtqw/sql/new
- [ ] Copy-paste isi file `supabase/schema.sql` ke SQL Editor, klik **Run**
- [ ] Copy-paste isi file `supabase/migrations/0002_soft_delete_finance.sql`, klik **Run**
- [ ] Copy-paste isi file `supabase/migrations/0003_cross_leadership_and_rls_gaps.sql`, klik **Run**
- [ ] Copy-paste isi file `supabase/migrations/0004_leadership_rpcs.sql`, klik **Run**
- [ ] Copy-paste isi file `supabase/migrations/0005_finance_absorbs_kas_nathan.sql`, klik **Run**
- [ ] Copy-paste isi file `supabase/migrations/0006_whatsapp_access.sql`, klik **Run**

**Verifikasi:** Jalankan query ini di SQL Editor:
```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' ORDER BY table_name;
```
Harusnya return: `admin_emails`, `audit_logs`, `cross_claim_codes`, `cross_memberships`, `crosses`, `events`, `finance_transactions`, `meeting_notes`, `ministry_emails`, `monthly_themes`, `profiles`, `skills`, `steward_assignments`, `treasurer_emails`

### Langkah 2: Tambah Email Bendahara (Nathan)

- [ ] Buka SQL Editor di Supabase
- [ ] Jalankan:
```sql
INSERT INTO public.treasurer_emails (email)
VALUES ('NATHAN@EMAIL.COM')  -- GANTI dengan email asli Nathan
ON CONFLICT DO NOTHING;
```
- [ ] Ganti `'NATHAN@EMAIL.COM'` dengan email Nathan yang sebenarnya

**Verifikasi:**
```sql
SELECT * FROM public.treasurer_emails;
```
Harusnya muncul 1 baris dengan email Nathan.

### Langkah 3: Tambah Email Admin

- [ ] Jalankan di SQL Editor:
```sql
INSERT INTO public.admin_emails (email)
VALUES ('DEX@EMAIL.COM')  -- GANTI dengan email asli Dex
ON CONFLICT DO NOTHING;
```
- [ ] Ganti `'DEX@EMAIL.COM'` dengan email Dex yang sebenarnya

**Verifikasi:**
```sql
SELECT * FROM public.admin_emails;
```
Harusnya muncul 1 baris dengan email Dex.

### Langkah 3B: Tambah Email Tim Ibadah (opsional)

- [ ] Jalankan di SQL Editor:
```sql
INSERT INTO public.ministry_emails (email)
VALUES ('TIM.IBADAH@EMAIL.COM')  -- GANTI dengan email tim ibadah yang sebenarnya
ON CONFLICT DO NOTHING;
```
- [ ] Ganti `'TIM.IBADAH@EMAIL.COM'` dengan email yang sebenarnya

**Verifikasi:**
```sql
SELECT * FROM public.ministry_emails;
```
Harusnya muncul 1 baris.

### Langkah 4: Aktifkan Google OAuth

- [ ] Buka Supabase Dashboard → Authentication → Providers
- [ ] Cari **Google**, klik **Enable**
- [ ] Masukkan **Client ID** dan **Client Secret** dari Google Cloud Console
  - Jika belum punya: buka https://console.cloud.google.com/apis/credentials
  - Create Credentials → OAuth 2.0 Client ID
  - Application type: Web application
  - Authorized redirect URIs: `https://rbouxffjcqjwywyhbtqw.supabase.co/auth/v1/callback`
- [ ] Klik **Save**

**Verifikasi:** Buka kembali Providers, Google harusnya menunjukkan status "Enabled"

---

## FASE 2: Vercel (butuh akses dashboard Vercel)

### Langkah 5: Pasang Environment Variables

- [ ] Buka https://vercel.com/dex-project/youth-gkkk-ms/settings/environment-variables
- [ ] Tambahkan variabel berikut:

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://rbouxffjcqjwywyhbtqw.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `(anon key dari Supabase)` |

Untuk mendapatkan anon key:
- Supabase Dashboard → Project Settings → API → copy `anon` `public` key

- [ ] Set environment: Production, Preview, Development (semua dipilih)
- [ ] Klik **Save**

### Langkah 6: Redeploy

- [ ] Buka Vercel Dashboard → Deployments
- [ ] Klik "..." di deployment terbaru → **Redeploy**
- [ ] Tunggu deploy selesai (biasanya 1-2 menit)

**Verifikasi:** Buka https://youth-gkkk-ms.vercel.app/login, klik "Lanjutkan dengan Google"
- Harusnya redirect ke halaman login Google (bukan error)
- Kalau masih error, cek lagi Langkah 5

---

## FASE 3: Import Data (setelah Fase 1 & 2 selesai)

### Langkah 7: Import SQL Data

- [ ] Buka kembali Supabase Dashboard → SQL Editor
- [ ] Buka file `scripts/import/output/00_all.sql` di repo
- [ ] Copy seluruh isi file ke SQL Editor
- [ ] Klik **Run**
- [ ] Jika terlalu besar, jalankan per bagian:
  1. Jalankan `members.sql` dulu
  2. Lalu `cross.sql`
  3. Lalu `finance.sql`
  4. Lalu `events.sql`

**Verifikasi:**
```sql
SELECT count(*) AS profiles FROM public.profiles;
-- Expected: 92

SELECT count(*) AS crosses FROM public.crosses;
-- Expected: 5

SELECT count(*) AS memberships FROM public.cross_memberships;
-- Expected: 44

SELECT count(*) AS events FROM public.events;
-- Expected: 29

SELECT count(*) AS finance FROM public.finance_transactions;
-- Expected: 5
```

Jika ada yang tidak cocok, laporkan ke AI untuk dibantu debug.

---

## FASE 4: Verifikasi Login & Roles

### Langkah 8: Test Login

- [ ] Buka https://youth-gkkk-ms.vercel.app/login
- [ ] Klik "Lanjutkan dengan Google"
- [ ] Login dengan akun Google Dex
- [ ] Harusnya redirect ke `/dashboard`

### Langkah 9: Verifikasi Role Admin (Dex)

- [ ] Setelah login, buka `/dashboard/settings`
- [ ] Harusnya menunjukkan role **admin**
- [ ] Buka `/dashboard/cross` — harusnya bisa lihat semua 5 Cross

### Langkah 10: Verifikasi Role Bendahara (Nathan)

- [ ] Logout, login dengan akun Nathan
- [ ] Buka `/dashboard/finance`
- [ ] Harusnya bisa akses fitur bendahara (tambahkan transaksi baru, export CSV, dll)

### Langkah 11: Verifikasi Role Leader

- [ ] Login dengan akun salah satu Cross Leader (misal: Erica)
- [ ] Buka `/dashboard/cross/mine`
- [ ] Harusnya hanya bisa kelola Cross-nya sendiri

---

## FASE 5: Launch Pilot

### Langkah 12: Publikasikan ke Dex & Angel

- [ ] Bagikan URL https://youth-gkkk-ms.vercel.app ke Dex dan Angel
- [ ] Minta mereka coba login dan isi data anggota per Cross masing-masing
- [ ] Awasi error/laporan selama 1-2 minggu pertama

### Langkah 13: Evaluasi

- [ ] Setelah 1-2 minggu, evaluasi:
  - Apakah ada bug?
  - Apakah data masuk akal?
  - Apakah ada fitur yang kurang?
- [ ] Putuskan apakah siap publikasikan ke 8 Cross Leader lainnya

---

## Yang Masih Menunggu Keputusan Dex

Setelah semua langkah di atas selesai, ada beberapa keputusan yang hanya bisa Dex buat:

1. **Nama anggota boleh tampil publik atau tidak?**
   - Sekarang: `/dashboard/members` hanya bisa diakses yang sudah login
   - Pilihan: buat read-only public view, atau tetap private

2. **"orang padang" dan "orang manado" di Cross 2** — siapa mereka? Perlu diganti dengan nama asli atau dihapus.

3. **Siapa lagi yang boleh jadi admin** — selain Dex, apakah ada yang lain?

4. **Kapan publikasikan ke 8 Cross Leader** — setelah pilot selesai dan stabil.

---

## Troubleshooting Cepat

| Masalah | Solusi |
|---------|--------|
| "supabaseUrl is required" | Env vars belum ter-set. Ulangi Langkah 5. |
| Login gagal / redirect loop | Google OAuth belum benar. Cek Langkah 4. |
| Data tidak muncul | Pastikan Langkah 7 sudah dijalankan. |
| RLS error | Pastikan sudah login sebelum akses dashboard. |
| "function does not exist" | Migrasi belum dijalankan. Ulangi Langkah 1. |
