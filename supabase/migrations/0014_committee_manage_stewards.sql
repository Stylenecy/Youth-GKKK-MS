-- 0014 — Committee boleh kelola baris penatalayan (UPDATE + DELETE).
--
-- KENAPA: sampai migrasi ini, steward_assignments hanya punya policy SELECT
-- + UPDATE-confirm-milik-sendiri. Akibatnya tombol "Batalkan" (undo
-- penugasan yang baru dibuat) dan fitur edit/hapus penatalayan SELALU
-- ditolak RLS. Kebijakan tulis INSERT sudah ada (dibuat Dex 28 Sep 2026
-- lewat SQL Editor); yang ini melengkapinya untuk ubah & hapus.
--
-- SELECT tetap diatur policy lama (0010/0012) — yang di sini hanya
-- menambah UPDATE + DELETE untuk committee (admin/treasurer/ministry
-- berbasis email). Anggota biasa tidak terdampak.
--
-- Safe to run more than once.

DROP POLICY IF EXISTS "Committee can manage steward assignments"
  ON public.steward_assignments;
CREATE POLICY "Committee can manage steward assignments"
  ON public.steward_assignments
  FOR ALL
  USING (public.is_committee())
  WITH CHECK (public.is_committee());

COMMENT ON POLICY "Committee can manage steward assignments"
  ON public.steward_assignments IS
  'Undo/edit/hapus penatalayan oleh pengurus (keputusan Dex, 29 Sep 2026).';
