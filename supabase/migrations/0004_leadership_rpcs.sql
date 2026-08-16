-- ============================================================
-- Migration 0004 — move Cross-leadership writes behind SECURITY DEFINER
-- functions instead of permissive client-side RLS policies.
-- Idempotent: safe to run more than once.
--
-- Why this replaces part of 0003:
-- 0003 let a signed-in user INSERT a cross_memberships row naming
-- themselves as leader (`profile_id = auth.uid()`), relying on the
-- Next.js server action to check the shared claim code first. That code
-- check only exists in the app layer — anyone who called the Supabase
-- REST API directly with their own session could self-claim any group
-- without knowing the code at all. Documented as a known gap at the time
-- ("PEMUDA88 is a light gate, not a hard boundary"); now closed properly.
--
-- The fix: two RPCs do the actual writes, both validate authorization in
-- SQL (not just TypeScript), and the permissive INSERT policies from 0003
-- are dropped so cross_memberships/profiles can no longer be written to
-- directly by a client at all — only through these two functions.
-- ============================================================

-- 1. Locked-down config tables. RLS enabled, zero policies: PostgREST
-- (anon or authenticated) cannot read or write these directly. Only a
-- SECURITY DEFINER function (or the SQL Editor / MCP, which runs as the
-- table owner) can touch them.
create table if not exists public.cross_claim_codes (
  id         int primary key default 1,
  code       text not null,
  updated_at timestamptz not null default now(),
  constraint cross_claim_codes_single_row check (id = 1)
);
alter table public.cross_claim_codes enable row level security;

create table if not exists public.admin_emails (
  email      text primary key,
  created_at timestamptz not null default now()
);
alter table public.admin_emails enable row level security;

-- Seed once; running this migration again must not overwrite a code Dex
-- has since rotated by hand in the SQL Editor.
insert into public.cross_claim_codes (id, code)
values (1, 'PEMUDA88')
on conflict (id) do nothing;

insert into public.admin_emails (email)
values ('dex.bennett28@gmail.com')
on conflict (email) do nothing;

-- 2. Prevent a duplicate active leader row for the same person+group —
-- closes a check-then-insert race (two rapid taps of "claim") at the
-- database level rather than trusting client-side debouncing alone.
create unique index if not exists cross_memberships_active_unique
  on public.cross_memberships (profile_id, cross_id, role)
  where is_active;

-- 3. Helper: is this email an admin? SECURITY DEFINER so it can read the
-- locked-down admin_emails table; STABLE because it only reads.
create or replace function public.is_admin_email(p_email text)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.admin_emails where email = lower(coalesce(p_email, ''))
  );
$$;

revoke all on function public.is_admin_email(text) from public;
grant execute on function public.is_admin_email(text) to authenticated;

-- 4. What can the signed-in user do? Single source of truth for the app
-- layer, so TypeScript never has to duplicate the admin-email check.
create or replace function public.get_my_app_role()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
begin
  if auth.uid() is null then
    return 'anonymous';
  end if;

  v_email := auth.jwt() ->> 'email';

  if public.is_admin_email(v_email) then
    return 'admin';
  end if;

  if exists (
    select 1 from public.cross_memberships
    where profile_id = auth.uid() and role = 'leader' and is_active = true
  ) then
    return 'leader';
  end if;

  return 'member';
end;
$$;

revoke all on function public.get_my_app_role() from public;
grant execute on function public.get_my_app_role() to authenticated;

-- 5. Claim leadership of a group. Validates the shared code in SQL (not
-- just in the calling TypeScript), so bypassing the app entirely still
-- requires knowing the real code. Idempotent: claiming a group you
-- already lead succeeds silently.
create or replace function public.claim_cross_leadership(p_cross_id uuid, p_code text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_expected text;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated' using errcode = '28000';
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

revoke all on function public.claim_cross_leadership(uuid, text) from public;
grant execute on function public.claim_cross_leadership(uuid, text) to authenticated;

-- 6. Quick-add a member: one profile + one membership row, in a single
-- transaction (this RPC call), so a mid-write failure can never leave a
-- profile with no group or a membership pointing at nothing. Authorization
-- (admin, or an active leader of this exact group) is checked here, not
-- trusted from the caller.
create or replace function public.add_cross_member(p_cross_id uuid, p_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
  v_new_id uuid;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated' using errcode = '28000';
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

revoke all on function public.add_cross_member(uuid, text) from public;
grant execute on function public.add_cross_member(uuid, text) to authenticated;

-- 7. Tighten back down: writes to cross_memberships/profiles now only
-- happen through the functions above, so the direct-insert policies from
-- 0003 are no longer needed — and leaving them in place would have been
-- the exact gap this migration exists to close.
drop policy if exists "Leaders and admins can add cross memberships" on public.cross_memberships;
drop policy if exists "Any authenticated user can add a member profile" on public.profiles;

-- The UPDATE policy from 0003 (a leader may update rows of a group they
-- already lead) is unaffected — it was never self-assignable, so it isn't
-- part of the gap this migration closes. Read access is unaffected too.
