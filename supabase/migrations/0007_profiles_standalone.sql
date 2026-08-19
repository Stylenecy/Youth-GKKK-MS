-- ============================================================
-- Migration 0007 — profiles boleh berdiri sendiri tanpa akun login
-- Idempotent: aman dijalankan lebih dari sekali.
--
-- KENAPA INI ADA
--
-- schema.sql mendefinisikan:
--     id uuid primary key references auth.users(id) on delete cascade
-- Artinya sebuah baris `profiles` cuma boleh ada kalau orangnya SUDAH punya
-- akun login (auth.users). Diverifikasi langsung di DB produksi 18 Ags 2026:
-- constraint `profiles_id_fkey` MASIH aktif, dan `profiles.id` TIDAK punya
-- DEFAULT.
--
-- Tiga akibat nyata dari itu:
--
--   1. Impor 93 anggota (scripts/import/output/members_fixed.sql) GAGAL TOTAL
--      di baris pertama — 93 UUID buatan tidak ada di auth.users.
--   2. RPC `add_cross_member` (migrasi 0004) MUSTAHIL jalan: dia melakukan
--      `insert into public.profiles (full_name, nickname, status)` tanpa id,
--      padahal id tidak punya default dan tidak nullable. Jadi tombol
--      "tambah anggota" di web YGMS sebenarnya rusak sejak awal — belum
--      ketahuan karena belum pernah ada anggota nyata yang ditambahkan.
--   3. Anggota pemuda yang tidak pernah login (mayoritas dari 93 orang)
--      tidak akan pernah bisa punya data di sistem.
--
-- Migrasi ini melepas kedua batasan itu. Setelah ini `profiles` jadi tabel
-- data orang yang berdiri sendiri; akun login tetap terhubung lewat id yang
-- sama untuk orang yang memang punya akun.
-- ============================================================

-- 1. Lepas keterikatan ke auth.users.
--    Data lama tidak disentuh: baris yang sudah ada tetap memakai id yang
--    sama dengan auth.users-nya, jadi seluruh RLS `auth.uid() = id` dan
--    fungsi 0004/0005/0006 tetap bekerja persis seperti sebelumnya.
alter table public.profiles
  drop constraint if exists profiles_id_fkey;

-- 2. Beri DEFAULT supaya insert tanpa id (add_cross_member, form web) jalan.
alter table public.profiles
  alter column id set default gen_random_uuid();

-- ============================================================
-- CATATAN YANG BELUM DIPUTUSKAN — jangan dianggap selesai
--
-- Trigger `on_auth_user_created` -> `handle_new_user()` tetap membuat baris
-- profiles BARU setiap kali seseorang login pertama kali. Sesudah 93 anggota
-- diimpor, kalau (misalnya) Angel login pakai Google, dia akan punya DUA
-- baris: satu hasil impor, satu hasil login. Aplikasi mengenali orang lewat
-- `auth.uid()`, jadi yang dibaca adalah baris hasil login yang kosong —
-- keanggotaan Cross dan skill-nya (yang menempel di baris hasil impor) tidak
-- akan terlihat.
--
-- Untuk Dex sendiri masalah ini SUDAH ditangani: members_fixed.sql memakai
-- id akun login Dex yang sudah ada (d92a80ff-…) alih-alih membuat baris
-- kedua, jadi setelah impor tetap ada tepat satu 'Dex Bennett'.
--
-- Untuk 92 orang lainnya keputusannya masih terbuka. Tiga pilihan:
--   (a) Saat orang baru login, cocokkan manual sekali lewat SQL Editor:
--       pindahkan id baris impor ke id auth-nya, lalu hapus baris duplikat.
--       Paling sederhana, tapi manual tiap orang.
--   (b) Ubah handle_new_user() supaya mencari profil yang sudah ada
--       berdasarkan email/nama dulu, dan cuma membuat baris baru kalau tidak
--       ketemu. Otomatis, tapi pencocokan berbasis nama bisa salah orang.
--   (c) Tambah kolom terpisah `auth_user_id uuid unique` dan pindahkan
--       seluruh pengenalan identitas ke kolom itu. Paling benar secara
--       struktur, tapi menyentuh RLS, 4 fungsi RPC, dan kode aplikasi.
--
-- Belum dipilih — sengaja tidak dikerjakan di migrasi ini supaya perubahan
-- di sini tetap minimal dan bisa dibaca utuh.
-- ============================================================
