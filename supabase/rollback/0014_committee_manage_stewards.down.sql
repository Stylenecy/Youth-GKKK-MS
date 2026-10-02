-- Rollback 0014 — kembali ke keadaan sebelum 2 Okt 2026: committee tidak
-- punya policy UPDATE/DELETE di steward_assignments (snapshot pg_policies
-- 2 Okt: hanya INSERT committee, SELECT approved, UPDATE konfirmasi sendiri).
-- Hanya policy; tidak ada baris data yang disentuh.

DROP POLICY IF EXISTS "Committee can update steward assignments"
  ON public.steward_assignments;
DROP POLICY IF EXISTS "Committee can delete steward assignments"
  ON public.steward_assignments;
DROP POLICY IF EXISTS "Committee can manage steward assignments"
  ON public.steward_assignments;
