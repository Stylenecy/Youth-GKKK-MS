-- Rollback 0016 — hapus jalur warta publik. Halaman depan kembali tanpa data
-- untuk tamu (kode aplikasi menangani hasil kosong dengan teks cadangan).
-- Hanya fungsi; tidak ada tabel, policy, atau baris data yang disentuh.

DROP FUNCTION IF EXISTS public.public_bulletin();
