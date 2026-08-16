-- ============================================================
-- Migration 0006 — WhatsApp contacts (BRIEF Kontak WhatsApp, 12 Ags 2026)
-- Idempotent: safe to run more than once.
--
-- Three layers, per the brief:
--   1. Column `profiles.whatsapp` (already in schema.sql; guarded here for
--      older databases).
--   2. COLUMN-LEVEL REVOKE: anon + authenticated can no longer SELECT the
--      whatsapp column at all. PostgREST serves only granted columns, so a
--      member-role client does not receive the field in any API response —
--      hiding it in the UI alone would still leak it through devtools.
--      The app must therefore select explicit column lists (see
--      PROFILE_COLUMNS in src/lib/data.ts).
--   3. SECURITY DEFINER getter get_member_whatsapp(): the ONLY path a
--      number leaves the database. It re-checks the caller's role in SQL.
--
-- Also adds the "tim ibadah" (ministry) role — same locked-down email
-- pattern as admin_emails (0004) and treasurer_emails (0005) — instead of
-- folding ministry access into admin.
-- ============================================================

-- 1. Column (guard for databases created before schema.sql gained it).
alter table public.profiles
  add column if not exists whatsapp text;

-- 2. Column-level revoke. Numbers must never reach an unprivileged client.
revoke select (whatsapp) on public.profiles from anon;
revoke select (whatsapp) on public.profiles from authenticated;

-- 3. Ministry (tim ibadah) role, same locked-down pattern as the others.
create table if not exists public.ministry_emails (
  email      text primary key,
  created_at timestamptz not null default now()
);
alter table public.ministry_emails enable row level security;

create or replace function public.is_ministry_email(p_email text)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.ministry_emails where email = lower(coalesce(p_email, ''))
  );
$$;

revoke all on function public.is_ministry_email(text) from public;
grant execute on function public.is_ministry_email(text) to authenticated;

-- 4. get_my_app_role() now also recognizes the ministry role.
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

  if public.is_treasurer_email(v_email) then
    return 'treasurer';
  end if;

  if public.is_ministry_email(v_email) then
    return 'ministry';
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

-- 5. The only sanctioned read path for a number. Callers with role
--    admin / treasurer / leader / ministry get it; everyone else gets null.
create or replace function public.get_member_whatsapp(p_profile_id uuid)
returns text
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  v_role   text;
  v_phone  text;
begin
  if auth.uid() is null then
    return null;
  end if;

  v_role := public.get_my_app_role();
  if v_role not in ('admin', 'treasurer', 'leader', 'ministry') then
    return null;
  end if;

  select whatsapp into v_phone from public.profiles where id = p_profile_id;
  return v_phone;
end;
$$;

revoke all on function public.get_member_whatsapp(uuid) from public;
grant execute on function public.get_member_whatsapp(uuid) to authenticated;
