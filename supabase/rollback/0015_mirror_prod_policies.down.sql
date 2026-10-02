-- Rollback 0015 — keadaan prod sebelum 0015 (snapshot pg_policies 2 Okt 2026)
-- SUDAH memuat kedua policy dengan definisi yang sama, jadi kembali ke
-- "sebelum" = memastikan keduanya ada persis seperti snapshot. Rollback ini
-- sengaja TIDAK menghidupkan lagi "Finance readable by approved accounts":
-- policy itu sudah tidak ada di prod sebelum 0015 (keputusan Dex 28 Sep).
-- Hanya policy; tidak ada baris data yang disentuh.

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
