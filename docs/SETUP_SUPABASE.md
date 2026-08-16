# Panduan: Sambungkan Supabase ke YGMS

> **Untuk:** Dex (pemilik kredensial)
> **Terakhir diperbarui:** 11 Agustus 2026
> **Status:** Menunggu Dex

Panduan ini memandu penyambungan Supabase langkah demi langkah. Setiap langkah ada cara memverifikasi bahwa langkah itu berhasil.

---

## Prasyarat

- [ ] Akun Supabase aktif (project: `rbouxffjcqjwywyhbtqw`)
- [ ] Akses ke dashboard Supabase
- [ ] Akses ke dashboard Vercel
- [ ] Email Nathan (untuk role Bendahara)

---

## Langkah 1: Jalankan Migrasi Database

**Tujuan:** Buat semua tabel dan fungsi di database Supabase.

**Caranya:**
1. Buka Supabase Dashboard → SQL Editor
2. Copy isi file `supabase/schema.sql`, paste ke SQL Editor, klik Run
3. Copy isi file `supabase/migrations/0002_soft_delete_finance.sql`, paste, Run
4. Copy isi file `supabase/migrations/0003_cross_leadership_and_rls_gaps.sql`, paste, Run
5. Copy isi file `supabase/migrations/0004_leadership_rpcs.sql`, paste, Run
6. Copy isi file `supabase/migrations/0005_finance_absorbs_kas_nathan.sql`, paste, Run
7. Copy isi file `supabase/migrations/0006_whatsapp_access.sql`, paste, Run

**Verifikasi:**
```sql
-- Jalankan ini di SQL Editor. Harusnya return 10+ baris.
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' ORDER BY table_name;
```
Expected output: `admin_emails`, `audit_logs`, `cross_claim_codes`, `cross_memberships`, `crosses`, `events`, `finance_transactions`, `meeting_notes`, `ministry_emails`, `monthly_themes`, `profiles`, `skills`, `steward_assignments`, `treasurer_emails`

```sql
-- Cek fungsi RPC tersedia
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public' AND routine_type = 'FUNCTION';
```
Expected output harus termasuk: `claim_cross_leadership`, `add_cross_member`, `get_my_app_role`, `is_admin_email`, `get_member_whatsapp`

---

## Langkah 2: Tambahkan Email Nathan sebagai Bendahara

**Tujuan:** Nathan bisa mengakses fitur keuangan.

**Caranya:**
1. Buka Supabase Dashboard → SQL Editor
2. Jalankan:

```sql
INSERT INTO public.treasurer_emails (email)
VALUES ('nathan@email.com')  -- GANTI dengan email Nathan yang sebenarnya
ON CONFLICT DO NOTHING;
```

**Verifikasi:**
```sql
SELECT * FROM public.treasurer_emails;
```
Expected output: 1 baris dengan email Nathan.

---

## Langahkan 3: Tambahkan Email Admin

**Tujuan:** Dex (dan lainnya yang berhak) bisa mengakses fitur admin.

**Caranya:**
```sql
INSERT INTO public.admin_emails (email) VALUES
  ('dex@email.com')  -- GANTI dengan email Dex yang sebenarnya
ON CONFLICT DO NOTHING;
```

**Verifikasi:**
```sql
SELECT * FROM public.admin_emails;
```

---

## Langkah 4: Aktifkan Google OAuth Provider

**Tujuan:** Pengurus bisa login pakai akun Google.

**Caranya:**
1. Buka Supabase Dashboard → Authentication → Providers
2. Cari "Google", klik Enable
3. Masukkan **Client ID** dan **Client Secret** dari Google Cloud Console
   - Jika belum punya: buka [Google Cloud Console](https://console.cloud.google.com) → Credentials → Create OAuth 2.0 Client ID
   - Authorized redirect URIs: `https://rbouxffjcqjwywyhbtqw.supabase.co/auth/v1/callback`
4. Klik Save

**Verifikasi:**
1. Buka Supabase Dashboard → Authentication → Providers
2. Google harusnya muncul dengan status "Enabled"

---

## Langkah 5: Pasang Environment Variables di Vercel

**Tujuan:** Aplikasi bisa terhubung ke Supabase.

**Caranya:**
1. Buka Vercel Dashboard → Project `youth-gkkk-ms` → Settings → Environment Variables
2. Tambahkan variabel berikut:

| Name | Value | Environment |
|------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://rbouxffjcqjwywyhbtqw.supabase.co` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `(anon key dari Supabase)` | Production, Preview, Development |

Untuk mendapatkan anon key:
- Supabase Dashboard → Project Settings → API → `anon` `public` key

**Verifikasi:**
1. Setelah menyimpan, redeploy: Vercel Dashboard → Deployments → klik "..." di latest → Redeploy
2. Tunggu deploy selesai
3. Buka `https://youth-gkkk-ms.vercel.app/login`
4. Klik "Lanjutkan dengan Google" — harusnya redirect ke halaman login Google

---

## Langkah 6: Impor Data Asli (setelah Langkah 1-5 selesai)

**Tujuan:** Data anggota, Cross, keuangan, dan jadwal masuk ke database.

**Caranya:**
1. Buka Supabase Dashboard → SQL Editor
2. Copy isi file `scripts/import/output/00_all.sql`, paste ke SQL Editor
3. Klik Run (mungkin perlu dijalankan dalam beberapa batch karena ukuran besar)

**Verifikasi:**
```sql
-- Cek jumlah anggota
SELECT count(*) FROM public.profiles;
```
Expected: 92

```sql
-- Cek Cross groups
SELECT count(*) FROM public.crosses;
```
Expected: 5

```sql
-- Cek memberships
SELECT count(*) FROM public.cross_memberships;
```
Expected: 44 (5 leaders + 39 members)

```sql
-- Cek events
SELECT count(*) FROM public.events;
```
Expected: 29

```sql
-- Cek finance
SELECT count(*) FROM public.finance_transactions;
```
Expected: 5

---

## Langkah 7: Verifikasi Login & Role

**Tujuan:** Pastikan sistem bisa membedakan admin, bendahara, leader, member.

**Caranya:**
1. Login dengan akun Google Dex
2. Buka `/dashboard/settings` — harusnya menunjukkan role "admin"
3. Logout, login dengan akun Nathan
4. Buka `/dashboard/finance` — Nathan harusnya bisa mengakses fitur bendahara

**Verifikasi:**
- Dex bisa lihat semua kelompok Cross di `/dashboard/cross`
- Nathan bisa akses `/dashboard/finance` dengan fitur bendahara
- Leader biasa hanya bisa kelola kelompoknya sendiri di `/dashboard/cross/mine`

---

## Troubleshooting

| Masalah | Kemungkinan Solusi |
|---------|-------------------|
| "supabaseUrl is required" error | Environment variables belum ter-set di Vercel. Cek Langkah 5. |
| Login gagal / redirect loop | Google OAuth belum dikonfigurasi dengan benar. Cek Langkah 4. |
| "new row violates row-level security policy" | User belum login, atau RLS policy belum terapkan. Cek Langkah 1. |
| Data tidak muncul setelah import | Pastikan `isSupabaseConfigured()` return true — cek env vars. |
| "claim_cross_leadership() does not exist" | Migrasi 0004 belum dijalankan. Cek Langkah 1. |

---

## Setelah Semua Selesai

Setelah langkah 1-7 selesai dan terverifikasi:
1. Mode demo otomatis nonaktif (karena `isSupabaseConfigured()` return true)
2. Data contoh (seed.ts) tidak lagi digunakan
3. Sistem siap untuk pilot 2 orang (Dex + Angel)

**Next step:** T3 — Jalur pilot 2 orang (Dex + Angel).
