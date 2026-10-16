-- Rollback 0024 — kembali ke keadaan sesudah 0023 (17 Okt 2026).
-- Efek: akun yang disetujui kembali bisa mengubah email profilnya sendiri,
-- satu anggota hanya dijaga pengecekan fungsi (tanpa index unik), dan
-- tautan otomatis saat daftar tidak lagi menunggu email terkonfirmasi.
DROP FUNCTION IF EXISTS public.unlink_account(uuid);
DROP INDEX IF EXISTS public.account_approvals_profile_id_key;
GRANT UPDATE ON public.profiles TO anon, authenticated;

-- Definisi 0023 (disalin utuh):
CREATE OR REPLACE FUNCTION public.link_account_by_email(p_user_id uuid)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_email   text;
  v_current uuid;
  v_match   uuid;
  v_n       int;
BEGIN
  SELECT lower(btrim(a.email)), a.profile_id INTO v_email, v_current
  FROM public.account_approvals a WHERE a.user_id = p_user_id;
  IF NOT FOUND THEN RETURN 'account_not_found'; END IF;
  IF v_current IS NOT NULL THEN RETURN 'already_linked'; END IF;
  -- Old accounts whose profile was created with the auth id itself.
  IF EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = p_user_id) THEN RETURN 'same_id'; END IF;
  IF coalesce(v_email, '') = '' THEN RETURN 'no_email'; END IF;

  SELECT count(*), (array_agg(p.id))[1] INTO v_n, v_match
  FROM public.profiles p WHERE lower(btrim(p.email)) = v_email;
  IF v_n = 0 THEN RETURN 'no_match'; END IF;
  IF v_n > 1 THEN RETURN 'ambiguous'; END IF;
  -- One member, one account: never steal a profile another login holds.
  IF EXISTS (SELECT 1 FROM public.account_approvals a
             WHERE a.profile_id = v_match AND a.user_id <> p_user_id) THEN
    RETURN 'taken';
  END IF;

  UPDATE public.account_approvals SET profile_id = v_match WHERE user_id = p_user_id;
  RETURN 'linked';
END;
$$;
REVOKE ALL ON FUNCTION public.link_account_by_email(uuid) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.link_account_to_profile(p_user_id uuid, p_profile_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_email text;
BEGIN
  IF NOT public.is_admin_email(auth.jwt() ->> 'email') THEN
    RAISE EXCEPTION 'not_an_admin';
  END IF;

  SELECT lower(btrim(email)) INTO v_email FROM public.account_approvals WHERE user_id = p_user_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'account_not_found'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_profile_id) THEN
    RAISE EXCEPTION 'profile_not_found';
  END IF;
  IF EXISTS (SELECT 1 FROM public.account_approvals
             WHERE profile_id = p_profile_id AND user_id <> p_user_id) THEN
    RAISE EXCEPTION 'profile_taken';
  END IF;
  IF coalesce(v_email, '') <> '' AND EXISTS (
       SELECT 1 FROM public.profiles
       WHERE lower(btrim(email)) = v_email AND id <> p_profile_id) THEN
    RAISE EXCEPTION 'email_on_other_profile';
  END IF;

  UPDATE public.account_approvals SET profile_id = p_profile_id WHERE user_id = p_user_id;
  -- Remember the email on the member, so a future login links by itself.
  IF coalesce(v_email, '') <> '' THEN
    UPDATE public.profiles SET email = v_email
    WHERE id = p_profile_id AND (email IS NULL OR btrim(email) = '');
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.account_approvals (user_id, email, display_name, status)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    'pending'
  )
  ON CONFLICT (user_id) DO NOTHING;
  PERFORM public.link_account_by_email(NEW.id);
  RETURN NEW;
END;
$$;
