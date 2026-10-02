-- 0014 — Committee boleh mengubah dan menghapus baris penatalayan.
--
-- KENAPA: sampai migrasi ini, steward_assignments hanya punya policy SELECT,
-- INSERT untuk committee (0015 mencerminkannya dari prod), dan UPDATE
-- "konfirmasi slot milik sendiri". Akibatnya tombol "Batalkan" (undo
-- penugasan yang baru dibuat) dan hapus per chip di Papan Penatalayan
-- SELALU ditolak RLS — DELETE yang ditolak RLS tidak melempar error, ia
-- cuma mengenai 0 baris.
--
-- Sengaja dua policy sempit (UPDATE, DELETE), bukan satu FOR ALL: SELECT
-- tetap diatur policy 0010 (approved saja) dan INSERT oleh policy committee
-- yang sudah ada. FOR ALL akan diam-diam ikut melebarkan SELECT/INSERT.
-- Committee = admin/bendahara/tim ibadah berbasis email (is_committee(), 0010).
-- Anggota biasa tidak terdampak.
--
-- Rollback: supabase/rollback/0014_committee_manage_stewards.down.sql
-- Safe to run more than once.

-- Nama lama (versi FOR ALL yang tidak pernah diterapkan di prod).
DROP POLICY IF EXISTS "Committee can manage steward assignments"
  ON public.steward_assignments;

DROP POLICY IF EXISTS "Committee can update steward assignments"
  ON public.steward_assignments;
CREATE POLICY "Committee can update steward assignments"
  ON public.steward_assignments
  FOR UPDATE
  USING (public.is_committee())
  WITH CHECK (public.is_committee());

DROP POLICY IF EXISTS "Committee can delete steward assignments"
  ON public.steward_assignments;
CREATE POLICY "Committee can delete steward assignments"
  ON public.steward_assignments
  FOR DELETE
  USING (public.is_committee());

COMMENT ON POLICY "Committee can update steward assignments"
  ON public.steward_assignments IS
  'Edit penatalayan oleh pengurus (keputusan Dex, 29 Sep 2026).';
COMMENT ON POLICY "Committee can delete steward assignments"
  ON public.steward_assignments IS
  'Undo/hapus penatalayan oleh pengurus (keputusan Dex, 29 Sep 2026).';
