-- Rollback 0025 — kembali ke keadaan produksi sebelum 0025 (18 Okt 2026).
-- Kolom profiles.is_pengurus SENGAJA tidak dihapus (bisa sudah diubah admin);
-- tanpa fungsi di bawah ia tidak dipakai apa-apa.

DROP TRIGGER IF EXISTS check_single_role ON public.steward_assignments;
DROP FUNCTION IF EXISTS public.check_single_role();
DROP FUNCTION IF EXISTS public.set_pengurus(uuid, boolean);

CREATE OR REPLACE FUNCTION public.is_pic_eligible(p_profile_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT (auth.uid() IS NULL OR public.is_approved())
    AND (
      EXISTS (
        SELECT 1 FROM public.cross_memberships m
        WHERE m.profile_id = p_profile_id
          AND m.role = 'leader'
          AND m.is_active
      ) OR EXISTS (
        SELECT 1 FROM public.account_approvals a
        WHERE a.profile_id = p_profile_id
          AND a.status = 'approved'
          AND (
            public.is_admin_email(a.email)
            OR public.is_treasurer_email(a.email)
            OR public.is_ministry_email(a.email)
          )
      )
    );
$$;

CREATE OR REPLACE FUNCTION public.list_pic_eligible()
RETURNS SETOF uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT s.profile_id FROM (
    SELECT m.profile_id FROM public.cross_memberships m
    WHERE m.role = 'leader' AND m.is_active
    UNION
    SELECT a.profile_id FROM public.account_approvals a
    WHERE a.profile_id IS NOT NULL
      AND a.status = 'approved'
      AND (
        public.is_admin_email(a.email)
        OR public.is_treasurer_email(a.email)
        OR public.is_ministry_email(a.email)
      )
  ) s
  WHERE auth.uid() IS NULL OR public.is_approved();
$$;
