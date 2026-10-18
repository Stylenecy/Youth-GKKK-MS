-- Rollback 0026 — set_pengurus() kembali ke versi 0025 (Audit "update",
-- galat not_an_admin). Untuk membatalkan 0025 sekalian, jalankan
-- 0025_pengurus_and_single_role.down.sql (fungsi ini ikut dihapus).
CREATE OR REPLACE FUNCTION public.set_pengurus(p_profile_id uuid, p_value boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_old boolean;
BEGIN
  IF NOT public.is_admin_email(auth.jwt() ->> 'email') THEN
    RAISE EXCEPTION 'not_an_admin' USING errcode = '42501';
  END IF;
  SELECT is_pengurus INTO v_old FROM public.profiles WHERE id = p_profile_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'profile_not_found' USING errcode = 'P0002';
  END IF;
  IF v_old IS DISTINCT FROM p_value THEN
    UPDATE public.profiles SET is_pengurus = p_value WHERE id = p_profile_id;
    PERFORM public.record_audit('update', 'profile', p_profile_id::text,
      jsonb_build_object('is_pengurus', v_old), jsonb_build_object('is_pengurus', p_value));
  END IF;
END;
$$;
