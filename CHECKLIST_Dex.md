# CHECKLIST DEX — Satu-satunya checklist yang perlu diikuti

> **Diperbarui:** 16 Agustus 2026
> **Dari:** AI Pelaksana
> Menggantikan versi 11 Agustus. `PANDUAN_DETAILS_Dex.md` dan
> `docs/SETUP_SUPABASE.md` masih ada sebagai penjelasan tambahan kalau ada
> langkah di sini yang kurang jelas, tapi **ikuti urutan di file ini.**

Berurutan — selesaikan satu langkah, verifikasi, baru lanjut. Centang `[x]` yang sudah selesai.

---

## FASE 0: Amankan repo (sekali saja, sebelum apa pun di bawah)

### Langkah 0: Buat repo GitHub + sambungkan remote

Repo ini **belum punya remote sama sekali** — sampai langkah ini selesai, satu-satunya salinan kerjaanmu ada di laptop ini. Kalau laptop rusak/hilang, semuanya hilang.

- [ ] Buka https://github.com/new
- [ ] Nama bebas (mis. `youth-gkkk-ms`), **visibility: Private** — data gereja, jangan public
- [ ] **Jangan** centang "Add README" / ".gitignore" / "license" (repo lokal sudah punya isi, biar tidak konflik)
- [ ] Klik **Create repository**
- [ ] Di layar berikutnya, GitHub kasih URL repo (bentuknya `https://github.com/USERNAME/NAMA.git`). Copy itu.
- [ ] Jalankan di terminal, di folder `D:\AT Kuliah\All of Project\Youth-GKKK_MS`:
```bash
git remote add origin https://github.com/USERNAME/NAMA.git
git push -u origin master
```
  (ganti URL dengan punyamu)

**Verifikasi:** buka halaman repo di GitHub, harusnya kelihatan semua file (README.md, src/, dst).

⚠️ **Jangan pernah** `git push --all` atau `git push --mirror` — itu akan ikut mendorong branch `archive/master-pre-reset-2026-08-16` yang sengaja ditinggal di laptop (isinya riwayat lama dengan data jemaat, lihat `.agent/archive/git-history-pre-reset_2026-08-16.txt` untuk catatan commit lamanya). `git push -u origin master` di atas **aman** — cuma mendorong branch `master` yang sudah bersih.

---

## FASE 1: Supabase — Database & Auth

### Langkah 1: Jalankan Migrasi Database

- [ ] Buka https://supabase.com/dashboard/project/rbouxffjcqjwywyhbtqw/sql/new
- [ ] Copy-paste isi `supabase/schema.sql` → **Run**
- [ ] Copy-paste isi `supabase/migrations/0002_soft_delete_finance.sql` → **Run**
- [ ] Copy-paste isi `supabase/migrations/0003_cross_leadership_and_rls_gaps.sql` → **Run**
- [ ] Copy-paste isi `supabase/migrations/0004_leadership_rpcs.sql` → **Run**
- [ ] Copy-paste isi `supabase/migrations/0005_finance_absorbs_kas_nathan.sql` → **Run**
- [ ] Copy-paste isi `supabase/migrations/0006_whatsapp_access.sql` → **Run**
  - Ini yang mengunci kolom nomor WhatsApp (revoke dari klien biasa + RPC
    `get_member_whatsapp()`). **Wajib dijalankan**, terlepas dari apakah kamu
    langsung mengisi tim ibadah di Langkah 2B atau tidak — tabelnya tetap
    dibuat, cuma kosong kalau belum diisi.

**Verifikasi:**
```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' ORDER BY table_name;
```
Harus muncul **14 tabel**: `admin_emails`, `audit_logs`, `cross_claim_codes`,
`cross_memberships`, `crosses`, `events`, `finance_transactions`,
`meeting_notes`, `ministry_emails`, `monthly_themes`, `profiles`, `skills`,
`steward_assignments`, `treasurer_emails`.

Kurang dari 14 → ada migrasi yang gagal jalan, ulangi yang hilang.

### Langkah 2: Tambah Email Nathan sebagai Bendahara

- [ ] Di SQL Editor:
```sql
INSERT INTO public.treasurer_emails (email)
VALUES ('EMAIL_NATHAN_DI_SINI')  -- ganti dengan email Google asli Nathan
ON CONFLICT DO NOTHING;
```
**Verifikasi:** `SELECT * FROM public.treasurer_emails;` → 1 baris.

### Langkah 3: Tambah Email Kamu sebagai Admin

- [ ] Di SQL Editor:
```sql
INSERT INTO public.admin_emails (email)
VALUES ('EMAIL_KAMU_DI_SINI')  -- ganti dengan email Google kamu
ON CONFLICT DO NOTHING;
```
**Verifikasi:** `SELECT * FROM public.admin_emails;` → 1 baris.

### Langkah 2B: Tambah Tim Ibadah (opsional, boleh dilewati)

Tanpa ini, hanya admin/bendahara/leader yang bisa lihat tombol WhatsApp
anggota — tidak ada yang rusak kalau dilewati.

- [ ] Kalau mau: `INSERT INTO public.ministry_emails (email) VALUES ('...') ON CONFLICT DO NOTHING;`

### Langkah 4: Aktifkan Google OAuth

- [ ] Supabase Dashboard → Authentication → Providers → **Google** → Enable
- [ ] Belum punya Client ID/Secret? → https://console.cloud.google.com/apis/credentials
  → Create Credentials → OAuth 2.0 Client ID → Web application
  → Authorized redirect URI: `https://rbouxffjcqjwywyhbtqw.supabase.co/auth/v1/callback`
- [ ] **Simpan Client ID + Client Secret di Bitwarden, bukan di file manapun di repo ini** (lihat rencana Vault-mu di `NOW.md`). Paste langsung dari Bitwarden ke kolom Client ID/Client Secret di Supabase.
- [ ] Klik **Save**

**Verifikasi:** Authentication → Providers → Google → status "Enabled".

---

## FASE 2: Vercel — Environment Variables

### Langkah 5: Pasang Environment Variables

- [ ] Vercel Dashboard → project `youth-gkkk-ms` → Settings → Environment Variables
- [ ] Tambah `NEXT_PUBLIC_SUPABASE_URL` = `https://rbouxffjcqjwywyhbtqw.supabase.co`
- [ ] Tambah `NEXT_PUBLIC_SUPABASE_ANON_KEY` = (copy dari Supabase → Project Settings → API → `anon` `public` key — key ini memang didesain publik/client-side, tapi tetap paste langsung dari Supabase, jangan simpan di file lain)
- [ ] Centang Production + Preview + Development untuk keduanya → **Save**

**Verifikasi:** kedua variabel muncul di daftar Environment Variables.

### Langkah 6: Redeploy

- [ ] Vercel Dashboard → Deployments → "..." di deployment teratas → **Redeploy**
- [ ] Tunggu sampai status "Ready" (~1-2 menit)

**Verifikasi:** buka https://youth-gkkk-ms.vercel.app/login, klik "Lanjutkan dengan Google" → harus redirect ke halaman login Google (bukan error page). Error "supabaseUrl is required" → env var belum benar, ulangi Langkah 5.

---

## FASE 3: Import Data Asli

### Langkah 7: Generate & Jalankan SQL Impor

File `scripts/import/output/00_all.sql` **sudah digenerate** (93 anggota, dari
`database/DATA_PEMUDA-GKKK-YK.xlsx`). Kalau kamu update file Excel-nya lagi
nanti, generate ulang dulu:
```bash
python scripts/import/run_all.py --execute
```

- [ ] Supabase SQL Editor → buka `scripts/import/output/00_all.sql` di repo → copy semua isi → paste → **Run**
  - Kalau terlalu besar/error, jalankan satu-satu: `members.sql` → `cross.sql` → `finance.sql` → `events.sql`

**Verifikasi (jalankan satu-satu):**
```sql
SELECT count(*) FROM public.profiles;              -- Harusnya: 93
SELECT count(*) FROM public.crosses;                -- Harusnya: 5
SELECT count(*) FROM public.cross_memberships;      -- Harusnya: 44 (5 leader + 39 anggota)
SELECT count(*) FROM public.events;                 -- Harusnya: 29
SELECT count(*) FROM public.finance_transactions;   -- Harusnya: 5
```

**Soal nomor WhatsApp:** dari 93 anggota, **1 nomor gagal dinormalisasi**
(bukan format seluler 628xxx — kemungkinan nomor rumah atau salah ketik) dan
otomatis dikosongkan; tombol WhatsApp tidak akan muncul untuk orang itu.
Jumlahnya saja yang dicatat di sini, bukan nomornya — cek sendiri di
`scripts/import/output/members.sql` (file lokal, tidak ter-commit) kalau
mau tahu siapa dan perbaiki di Excel sumber.

---

## FASE 4: Verifikasi Login & Role

### Langkah 8-11: Test tiap peran

- [ ] Login dengan akun Google kamu → redirect ke `/dashboard` → `/dashboard/settings` menunjukkan role **admin** → `/dashboard/cross` menunjukkan 5 Cross
- [ ] Logout, login sebagai Nathan → `/dashboard/finance` bisa tambah transaksi + export CSV
- [ ] Logout, login sebagai salah satu Cross Leader (mis. Erica) → `/dashboard/cross/mine` cuma menunjukkan kelompoknya sendiri, ada form "Tambah anggota"
- [ ] (Kalau ada yang leader dari peran ministry) → tombol "Chat via WhatsApp" muncul di halaman profil anggota; login sebagai anggota biasa → tombol itu **tidak boleh muncul**, dan cek DevTools Network tab: respons API tidak boleh punya field `whatsapp`

---

## FASE 5: Pilot Dex + Angel

- [ ] Bagikan https://youth-gkkk-ms.vercel.app ke Angel, minta login + isi anggota Cross-nya lewat `/dashboard/cross/mine`
- [ ] Awasi 1-2 minggu — error? fitur kurang? data ganjil?
- [ ] Putuskan: publikasikan ke 8 Cross Leader lainnya, atau perbaiki dulu

---

## Yang Hanya Kamu yang Bisa Putuskan

1. Nama anggota tampil publik atau tetap perlu login?
2. Siapa lagi yang jadi admin selain kamu?
3. "orang padang"/"orang manado" placeholder di data Cross lama — sudah teridentifikasi salah satunya Matthew, sisanya perlu dicek
4. Kapan publikasikan ke 8 Cross Leader

---

## Troubleshooting Cepat

| Masalah | Solusi |
|---------|--------|
| "supabaseUrl is required" | Env vars belum ter-set. Ulangi Langkah 5. |
| Login gagal / redirect loop | Google OAuth belum benar / cookies. Cek Langkah 4, coba clear cookies. |
| Data tidak muncul setelah import | Cek Langkah 7 sudah jalan semua, cek `isSupabaseConfigured()` = true (env vars benar). |
| "function does not exist" | Migrasi belum lengkap. Ulangi Langkah 1. |
| "new row violates row-level security policy" | Belum login, atau RLS belum jalan (Langkah 1). |
| Tombol WhatsApp tidak muncul padahal harusnya | Cek role kamu ada di admin_emails/treasurer_emails/leader/ministry_emails, dan nomor anggota itu memang lolos normalisasi (628...). |
