-- Rollback 0023 — kembali ke keadaan produksi sebelum 0023 (16 Okt 2026).
-- Kolom profiles.email SENGAJA tidak dihapus (bisa sudah berisi data);
-- tanpa fungsi penaut ia tidak dipakai apa-apa. Tautan account_approvals.
-- profile_id yang sudah dibuat juga tetap (my_profile_id() sudah ada
-- sebelum 0023 dan membacanya).
-- Efek: kolom whatsapp kembali terbaca lewat REST oleh akun yang disetujui.

GRANT SELECT ON public.profiles TO anon, authenticated;

DROP FUNCTION IF EXISTS public.link_account_to_profile(uuid, uuid);

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
  RETURN NEW;
END;
$$;

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
END;
$$;

DROP FUNCTION IF EXISTS public.link_account_by_email(uuid);

CREATE OR REPLACE FUNCTION public.record_audit(p_action text, p_entity_type text, p_entity_id text, p_old_value jsonb DEFAULT NULL::jsonb, p_new_value jsonb DEFAULT NULL::jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RETURN;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_uid) THEN
    RETURN;
  END IF;

  INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, old_value, new_value)
  VALUES (v_uid, p_action, p_entity_type, p_entity_id, p_old_value, p_new_value);
END;
$$;

-- claim_cross_leadership / add_cross_member: definisi 0021.
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
    values (auth.uid(), p_cross_id, 'leader', true);
  exception when unique_violation then
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
      where profile_id = auth.uid() and cross_id = p_cross_id
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
  USING ((auth.uid() = id) AND public.is_approved())
  WITH CHECK ((auth.uid() = id) AND public.is_approved());

DROP POLICY IF EXISTS "Approved members confirm own steward slot" ON public.steward_assignments;
CREATE POLICY "Approved members confirm own steward slot" ON public.steward_assignments
  FOR UPDATE TO authenticated
  USING ((auth.uid() = profile_id) AND public.is_approved())
  WITH CHECK ((auth.uid() = profile_id) AND public.is_approved());

DROP POLICY IF EXISTS "Leaders can update their own group memberships" ON public.cross_memberships;
CREATE POLICY "Leaders can update their own group memberships" ON public.cross_memberships
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.cross_memberships existing
    WHERE existing.cross_id = cross_memberships.cross_id
      AND existing.profile_id = auth.uid()
      AND existing.role = 'leader'
      AND existing.is_active = true
  ));
