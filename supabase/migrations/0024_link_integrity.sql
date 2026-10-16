-- 0024 — Tautan akun ↔ anggota dijaga database (gauntlet teknis S19, 17 Okt 2026).
--
-- 1. profiles.email tidak bisa diubah pengguna. Policy "Approved users can
--    update own profile" + hak UPDATE tingkat tabel membuat akun yang
--    disetujui bisa mengganti email profilnya sendiri — kunci penautan —
--    ke email orang lain. UPDATE tabel dicabut dan diberikan per kolom tanpa
--    email (dan tanpa id/created_at). Aplikasi tidak menulis profiles secara
--    langsung; email hanya diisi link_account_to_profile (SECURITY DEFINER).
-- 2. Satu anggota satu akun, dijaga index unik — bukan hanya dicek fungsi —
--    dan pemilik profil lama yang ber-id sama dengan akunnya ikut dihitung.
-- 3. Tautan otomatis saat daftar hanya untuk email yang sudah terkonfirmasi.
-- 4. unlink_account(): admin melepas tautan yang salah; email yang tadinya
--    diingat di anggota itu ikut dihapus supaya tidak menaut lagi.
--
-- Rollback: supabase/rollback/0024_link_integrity.down.sql

-- 1 ---------------------------------------------------------------------
REVOKE UPDATE ON public.profiles FROM anon, authenticated;
GRANT UPDATE (
  full_name, nickname, whatsapp, birth_date, hometown, university, cohort,
  status, notes, avatar_url, is_active, updated_at
) ON public.profiles TO authenticated;

-- 2 ---------------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS account_approvals_profile_id_key
  ON public.account_approvals (profile_id) WHERE profile_id IS NOT NULL;

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
  IF EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = p_user_id) THEN RETURN 'same_id'; END IF;
  IF coalesce(v_email, '') = '' THEN RETURN 'no_email'; END IF;

  SELECT count(*), (array_agg(p.id))[1] INTO v_n, v_match
  FROM public.profiles p WHERE lower(btrim(p.email)) = v_email;
  IF v_n = 0 THEN RETURN 'no_match'; END IF;
  IF v_n > 1 THEN RETURN 'ambiguous'; END IF;
  -- Held by another login: linked to it, or an old account sharing its id.
  IF EXISTS (SELECT 1 FROM public.account_approvals a
             WHERE (a.profile_id = v_match OR a.user_id = v_match)
               AND a.user_id <> p_user_id) THEN
    RETURN 'taken';
  END IF;

  BEGIN
    UPDATE public.account_approvals SET profile_id = v_match WHERE user_id = p_user_id;
  EXCEPTION WHEN unique_violation THEN
    RETURN 'taken';
  END;
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
             WHERE (profile_id = p_profile_id OR user_id = p_profile_id)
               AND user_id <> p_user_id) THEN
    RAISE EXCEPTION 'profile_taken';
  END IF;
  IF coalesce(v_email, '') <> '' AND EXISTS (
       SELECT 1 FROM public.profiles
       WHERE lower(btrim(email)) = v_email AND id <> p_profile_id) THEN
    RAISE EXCEPTION 'email_on_other_profile';
  END IF;

  BEGIN
    UPDATE public.account_approvals SET profile_id = p_profile_id WHERE user_id = p_user_id;
  EXCEPTION WHEN unique_violation THEN
    RAISE EXCEPTION 'profile_taken';
  END;
  IF coalesce(v_email, '') <> '' THEN
    UPDATE public.profiles SET email = v_email
    WHERE id = p_profile_id AND (email IS NULL OR btrim(email) = '');
  END IF;
END;
$$;

-- 3 ---------------------------------------------------------------------
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
  -- Only a confirmed address may claim a member (Google sign-in confirms it).
  IF NEW.email_confirmed_at IS NOT NULL THEN
    PERFORM public.link_account_by_email(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

-- 4 ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.unlink_account(p_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_email   text;
  v_profile uuid;
BEGIN
  IF NOT public.is_admin_email(auth.jwt() ->> 'email') THEN
    RAISE EXCEPTION 'not_an_admin';
  END IF;

  SELECT lower(btrim(email)), profile_id INTO v_email, v_profile
  FROM public.account_approvals WHERE user_id = p_user_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'account_not_found'; END IF;
  IF v_profile IS NULL THEN RETURN; END IF;

  UPDATE public.account_approvals SET profile_id = NULL WHERE user_id = p_user_id;
  -- Forget the email on that member only if it was this login's.
  UPDATE public.profiles SET email = NULL
  WHERE id = v_profile AND lower(btrim(email)) = v_email;
END;
$$;
REVOKE ALL ON FUNCTION public.unlink_account(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.unlink_account(uuid) TO authenticated;
