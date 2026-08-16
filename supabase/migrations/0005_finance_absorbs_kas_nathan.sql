-- ============================================================
-- Migration 0005 — finance schema absorbs Nathan's kas structure
-- Idempotent.
--
-- Goal (Dex, 11 Ags): YGMS finance should replace the spreadsheet, not sit
-- next to it. Nathan's sheet splits cash into Kas Besar / Kas Kecil and
-- uses a fixed set of income/expense categories — both now live here.
-- Full double-entry (his Jurnal/Buku Besar/Neraca) is NOT replicated:
-- one row per cash movement, same model the app already used, just with
-- the missing "which cash pool" dimension added.
-- ============================================================

alter table public.finance_transactions
  add column if not exists account text not null default 'kas_kecil'
  check (account in ('kas_besar','kas_kecil'));

-- Treasurer role, same locked-down pattern as admin_emails (migration 0004):
-- RLS enabled, zero client policies, readable only by SECURITY DEFINER
-- functions or the SQL Editor.
create table if not exists public.treasurer_emails (
  email      text primary key,
  created_at timestamptz not null default now()
);
alter table public.treasurer_emails enable row level security;

create or replace function public.is_treasurer_email(p_email text)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.treasurer_emails where email = lower(coalesce(p_email, ''))
  );
$$;

revoke all on function public.is_treasurer_email(text) from public;
grant execute on function public.is_treasurer_email(text) to authenticated;

-- get_my_app_role() (0004) now also recognizes treasurer.
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

  if exists (
    select 1 from public.cross_memberships
    where profile_id = auth.uid() and role = 'leader' and is_active = true
  ) then
    return 'leader';
  end if;

  return 'member';
end;
$$;

-- Finance writes: previously any authenticated user (schema.sql original
-- policies). Dex wants only the treasurer (+ admin) recording transactions.
-- Drop both old (0003) and new (0005) policy names so this migration is fully
-- idempotent even if it was partially applied before.
drop policy if exists "Committee can insert finance" on public.finance_transactions;
drop policy if exists "Committee can update finance" on public.finance_transactions;
drop policy if exists "Treasurer and admin can insert finance" on public.finance_transactions;
drop policy if exists "Treasurer and admin can update finance" on public.finance_transactions;

create policy "Treasurer and admin can insert finance"
  on public.finance_transactions for insert
  with check (
    public.is_admin_email(auth.jwt()->>'email')
    or public.is_treasurer_email(auth.jwt()->>'email')
  );

create policy "Treasurer and admin can update finance"
  on public.finance_transactions for update
  using (
    public.is_admin_email(auth.jwt()->>'email')
    or public.is_treasurer_email(auth.jwt()->>'email')
  );

-- Nathan's email isn't known to this migration — add it once, e.g.:
--   insert into public.treasurer_emails (email) values ('nathan@example.com');
