-- 0015 — Cerminkan ke repo dua policy yang dibuat langsung di SQL Editor
-- produksi (28 Sep 2026), supaya repo = prod.
--
-- Keadaan prod 2 Okt 2026 (pg_policies, dibaca sebelum migrasi):
--   * finance_transactions "Finance readable by admin and treasurer" (SELECT)
--     — keputusan Dex 28 Sep "Opsi A": buku kas hanya dibaca admin + bendahara.
--     Policy lama 0010 "Finance readable by approved accounts" sudah tidak ada.
--   * steward_assignments "Committee can insert steward assignments" (INSERT)
--     — keputusan Dex 28 Sep: pengurus boleh mengisi penatalayan.
-- Definisi di bawah sama persis dengan prod (permissive, roles public,
-- qual/with_check). Di prod migrasi ini tidak mengubah hak siapa pun; di
-- database yang dibangun dari repo ia menutup celah 0010 (kas terbaca semua
-- akun approved) dan membuka INSERT committee.
--
-- Rollback: supabase/rollback/0015_mirror_prod_policies.down.sql
-- Safe to run more than once.

DROP POLICY IF EXISTS "Finance readable by approved accounts"
  ON public.finance_transactions;
DROP POLICY IF EXISTS "Finance readable by admin and treasurer"
  ON public.finance_transactions;
CREATE POLICY "Finance readable by admin and treasurer"
  ON public.finance_transactions
  FOR SELECT
  USING (
    public.is_admin_email(auth.jwt() ->> 'email')
    OR public.is_treasurer_email(auth.jwt() ->> 'email')
  );

DROP POLICY IF EXISTS "Committee can insert steward assignments"
  ON public.steward_assignments;
CREATE POLICY "Committee can insert steward assignments"
  ON public.steward_assignments
  FOR INSERT
  WITH CHECK (public.is_committee());
