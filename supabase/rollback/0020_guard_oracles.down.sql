-- Rollback 0020 — kembalikan kelima fungsi ke definisi sebelum 0020
-- (salinan pg_get_functiondef produksi, 4 Okt 2026). GRANT tidak berubah.
-- Efek: akun pending kembali bisa menebak email pengurus dan membaca
-- daftar id PIC — hanya jalankan bila 0020 merusak hak akses pengurus.

CREATE OR REPLACE FUNCTION public.is_admin_email(p_email text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  select exists (
    select 1 from public.admin_emails where email = lower(coalesce(p_email, ''))
  );
$$;

CREATE OR REPLACE FUNCTION public.is_treasurer_email(p_email text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  select exists (
    select 1 from public.treasurer_emails where email = lower(coalesce(p_email, ''))
  );
$$;

CREATE OR REPLACE FUNCTION public.is_ministry_email(p_email text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  select exists (
    select 1 from public.ministry_emails where email = lower(coalesce(p_email, ''))
  );
$$;

CREATE OR REPLACE FUNCTION public.list_pic_eligible()
RETURNS SETOF uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
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
    );
$$;

CREATE OR REPLACE FUNCTION public.is_pic_eligible(p_profile_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
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
  );
$$;
