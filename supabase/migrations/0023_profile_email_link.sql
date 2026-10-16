-- 0023 — Akun login tertaut otomatis ke data anggota lewat email yang persis
-- sama (S19 opsi b, keputusan Dex 16 Okt 2026 23.53) + kolom pribadi profiles
-- benar-benar tertutup.
--
-- 1. PERBAIKAN 0006. `revoke select (whatsapp)` di 0006 tidak pernah berlaku:
--    anon dan authenticated masih punya SELECT tingkat TABEL, dan hak tabel
--    mengalahkan pencabutan kolom (diperiksa 16 Okt: has_column_privilege
--    authenticated/whatsapp = true). Akun yang sudah disetujui bisa membaca
--    semua nomor WA lewat REST langsung, melewati get_member_whatsapp().
--    Sekarang: SELECT tabel dicabut, lalu diberikan per kolom — tanpa
--    whatsapp dan tanpa email. Aplikasi selalu memakai daftar kolom
--    eksplisit (PROFILE_COLUMNS), jadi tidak ada bacaan yang berubah.
--
-- 2. profiles.email (pribadi, unik tanpa beda huruf besar/kecil).
--
-- 3. link_account_by_email(user): tautkan akun ke SATU profil yang emailnya
--    persis sama. Tidak menebak dari nama. Tidak menaut bila: email kosong,
--    tidak ada yang cocok, atau profil itu sudah tertaut ke akun lain —
--    akun itu tampil "perlu dicek" untuk admin. Dipanggil saat daftar
--    (handle_new_user) dan saat admin menyetujui (decide_account); hanya
--    bisa dipanggil dari dalam database.
--
-- 4. link_account_to_profile(user, profil): admin menautkan akun yang
--    "perlu dicek" ke anggota yang benar; email akun disimpan di profil itu
--    supaya login berikutnya tertaut otomatis.
--
-- 5. record_audit memakai my_profile_id() — akun yang tertaut lewat
--    profile_id kini ikut tercatat di Audit (celah R6 #9).
--
-- 6. Klaim pemimpin / tambah anggota Cross (isi 0021) dan 3 policy UPDATE
--    yang masih membandingkan dengan auth.uid() kini memakai my_profile_id():
--    akun yang tertaut bertindak sebagai anggota yang benar. Untuk akun lama
--    (profil ber-id sama dengan akun) hasilnya identik dengan sebelumnya.
--
-- Rollback: supabase/rollback/0023_profile_email_link.down.sql

-- 1 ---------------------------------------------------------------------
REVOKE SELECT ON public.profiles FROM anon, authenticated;
GRANT SELECT (
  id, full_name, nickname, birth_date, hometown, university, cohort,
  status, notes, avatar_url, is_active, created_at, updated_at
) ON public.profiles TO authenticated;

-- 2 ---------------------------------------------------------------------
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;
CREATE UNIQUE INDEX IF NOT EXISTS profiles_email_lower_key
  ON public.profiles (lower(btrim(email))) WHERE email IS NOT NULL AND btrim(email) <> '';

-- 3 ---------------------------------------------------------------------
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

-- handle_new_user: same as 0010 + try the email link right away, so the
-- approval queue already shows who the request belongs to.
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

-- decide_account: same as 0011 + link on approval.
CREATE OR REPLACE FUNCTION public.decide_account(p_user_id uuid, p_status text, p_note text DEFAULT NULL::text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin_email(auth.jwt() ->> 'email') THEN
    RAISE EXCEPTION 'not_an_admin';
  END IF;

  IF p_status NOT IN ('approved', 'rejected', 'pending') THEN
    RAISE EXCEPTION 'invalid_status';
  END IF;

  IF p_user_id = auth.uid() AND p_status <> 'approved' THEN
    RAISE EXCEPTION 'cannot_revoke_self';
  END IF;

  UPDATE public.account_approvals
  SET status     = p_status,
      decided_at = now(),
      decided_by = auth.uid(),
      note       = COALESCE(p_note, note)
  WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'account_not_found';
  END IF;

  IF p_status = 'approved' THEN
    PERFORM public.link_account_by_email(p_user_id);
  END IF;
END;
$$;

-- 4 ---------------------------------------------------------------------
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
REVOKE ALL ON FUNCTION public.link_account_to_profile(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.link_account_to_profile(uuid, uuid) TO authenticated;

-- 5 ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.record_audit(p_action text, p_entity_type text, p_entity_id text, p_old_value jsonb DEFAULT NULL::jsonb, p_new_value jsonb DEFAULT NULL::jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_pid uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;

  -- my_profile_id(): the linked member (account_approvals.profile_id) or,
  -- for old accounts, the profile sharing the auth id.
  v_pid := public.my_profile_id();
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_pid) THEN
    RETURN;
  END IF;

  INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, old_value, new_value)
  VALUES (v_pid, p_action, p_entity_type, p_entity_id, p_old_value, p_new_value);
END;
$$;


-- 6 ---------------------------------------------------------------------
-- Same as 0021 except: the new leader row and the leader check use the
-- caller's member profile (my_profile_id()), not the raw auth id.
CREATE OR REPLACE FUNCTION public.claim_cross_leadership(p_cross_id uuid, p_code text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
declare
  v_expected text;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  if not public.is_approved() then
    raise exception 'not_approved' using errcode = '42501';
  end if;

  select code into v_expected from public.cross_claim_codes where id = 1;
  if v_expected is null or p_code is null or btrim(p_code) <> v_expected then
    raise exception 'invalid_code' using errcode = '28000';
  end if;

  if not exists (select 1 from public.crosses where id = p_cross_id) then
    raise exception 'cross_not_found' using errcode = 'P0002';
  end if;

  begin
    insert into public.cross_memberships (profile_id, cross_id, role, is_active)
    values (public.my_profile_id(), p_cross_id, 'leader', true);
  exception when unique_violation then
    -- Already claimed by this same member — fine, not an error.
    null;
  end;
end;
$$;

CREATE OR REPLACE FUNCTION public.add_cross_member(p_cross_id uuid, p_name text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
declare
  v_name text;
  v_new_id uuid;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  if not public.is_approved() then
    raise exception 'not_approved' using errcode = '42501';
  end if;

  v_name := btrim(p_name);
  if v_name = '' then
    raise exception 'name_required' using errcode = '22023';
  end if;
  if length(v_name) > 80 then
    raise exception 'name_too_long' using errcode = '22023';
  end if;

  if not exists (select 1 from public.crosses where id = p_cross_id) then
    raise exception 'cross_not_found' using errcode = 'P0002';
  end if;

  if not (
    public.is_admin_email(auth.jwt() ->> 'email')
    or exists (
      select 1 from public.cross_memberships
      where profile_id = public.my_profile_id() and cross_id = p_cross_id
        and role = 'leader' and is_active = true
    )
  ) then
    raise exception 'not_a_leader_of_this_group' using errcode = '42501';
  end if;

  insert into public.profiles (full_name, nickname, status)
  values (v_name, v_name, 'active')
  returning id into v_new_id;

  insert into public.cross_memberships (profile_id, cross_id, role, is_active)
  values (v_new_id, p_cross_id, 'member', true);

  return v_new_id;
end;
$$;

DROP POLICY IF EXISTS "Approved users can update own profile" ON public.profiles;
CREATE POLICY "Approved users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING ((public.my_profile_id() = id) AND public.is_approved())
  WITH CHECK ((public.my_profile_id() = id) AND public.is_approved());

DROP POLICY IF EXISTS "Approved members confirm own steward slot" ON public.steward_assignments;
CREATE POLICY "Approved members confirm own steward slot" ON public.steward_assignments
  FOR UPDATE TO authenticated
  USING ((public.my_profile_id() = profile_id) AND public.is_approved())
  WITH CHECK ((public.my_profile_id() = profile_id) AND public.is_approved());

DROP POLICY IF EXISTS "Leaders can update their own group memberships" ON public.cross_memberships;
CREATE POLICY "Leaders can update their own group memberships" ON public.cross_memberships
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.cross_memberships existing
    WHERE existing.cross_id = cross_memberships.cross_id
      AND existing.profile_id = public.my_profile_id()
      AND existing.role = 'leader'
      AND existing.is_active = true
  ));

-- Backfill: try every account that has no link yet (a no-op until members
-- have an email on file).
SELECT public.link_account_by_email(a.user_id)
FROM public.account_approvals a WHERE a.profile_id IS NULL;
