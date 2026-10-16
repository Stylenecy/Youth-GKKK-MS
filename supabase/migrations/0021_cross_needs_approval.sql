-- 0021 — Aksi Cross butuh akun yang disetujui (audit R6 #5, 16 Okt 2026).
--
-- Siapa pun bisa masuk dengan Google dan langsung menjadi akun "pending"
-- (authenticated, belum disetujui admin). Sebelum migrasi ini, akun pending
-- itu masih bisa:
--   - claim_cross_leadership(): menjadi pemimpin kelompok Cross bila tahu
--     kodenya;
--   - add_cross_member(): menambah anggota (membuat profil) bila sudah
--     tercatat sebagai pemimpin.
--
-- Aturan baru, sama untuk keduanya: sesudah cek login, akun harus
-- is_approved() (admin selalu lolos; lihat 0010/0020). Pesan galat
-- 'not_approved' diterjemahkan aplikasi (src/lib/db-errors.ts).
-- Isi fungsi lain tidak berubah: salinan definisi produksi 16 Okt 2026
-- (sama dengan 0004) + satu blok IF.
--
-- Hak EXECUTE tidak berubah (CREATE OR REPLACE mempertahankan GRANT).
-- Rollback: supabase/rollback/0021_cross_needs_approval.down.sql

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
    -- Already claimed by this same user — fine, not an error.
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
