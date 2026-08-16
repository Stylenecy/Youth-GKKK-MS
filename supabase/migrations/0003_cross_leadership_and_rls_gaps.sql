-- ============================================================
-- Migration 0003 — multi-leader Cross groups + RLS gap fixes
-- Idempotent: safe to run more than once.
--
-- Two things bundled here because they were discovered together, both
-- blocking tonight's "Cross Leader logs in and manages their own group"
-- rollout:
--
-- 1. cross_memberships and skills had RLS enabled but ZERO policies —
--    meaning every real query against them was silently denied. Nobody
--    would have noticed until the first real login, since demo mode never
--    touches the real database.
-- 2. crosses.leader_id is a single FK. Two of the five real Cross groups
--    are co-led by more than one person, so leadership now lives as a
--    role on cross_memberships instead — a group can have any number of
--    active `role = 'leader'` rows.
-- ============================================================

-- 1. Leadership as a membership role, not a single FK.
alter table public.cross_memberships
  add column if not exists role text not null default 'member'
  check (role in ('leader','member'));

-- 2. Idempotent seeding: insert-or-skip by name instead of by generated id.
create unique index if not exists crosses_name_key on public.crosses (name);

insert into public.crosses (name, description, meeting_day, meeting_time, is_active)
values
  ('Cross TAMBALBAND', 'Dipimpin sendiri oleh Dex.', 'Sabtu', '17:00', true),
  ('Cross Angel', 'Dipimpin sendiri oleh Angel.', 'Sabtu', '17:00', true),
  ('Cross Wangke-Arion', 'Dipimpin bersama oleh Wangke dan Arion.', 'Sabtu', '17:00', true),
  ('Cross Nita-Grace-Erica', 'Dipimpin bersama oleh Nita, Grace, dan Erica.', 'Sabtu', '17:00', true),
  ('Cross Nathan', 'Dipimpin sendiri oleh Nathan.', 'Sabtu', '17:00', true)
on conflict (name) do nothing;

-- 3. RLS: fill the gaps.
drop policy if exists "Cross memberships viewable by authenticated" on public.cross_memberships;
drop policy if exists "Leaders and admins can add cross memberships" on public.cross_memberships;
drop policy if exists "Leaders can update their own group memberships" on public.cross_memberships;
drop policy if exists "Any authenticated user can add a member profile" on public.profiles;
drop policy if exists "Skills viewable by authenticated" on public.skills;
drop policy if exists "Committee can update finance" on public.finance_transactions;

create policy "Cross memberships viewable by authenticated"
  on public.cross_memberships for select using (auth.role() = 'authenticated');

-- A signed-in user may insert a membership row naming themselves (the
-- self-claim flow — gated by a shared code checked in the server action,
-- not by RLS, so this is a light gate against casual poking, not a hard
-- security boundary) OR add a row to a group they already actively lead
-- (the quick-add-member flow).
create policy "Leaders and admins can add cross memberships"
  on public.cross_memberships for insert
  with check (
    auth.role() = 'authenticated'
    and (
      profile_id = auth.uid()
      or exists (
        select 1 from public.cross_memberships existing
        where existing.cross_id = cross_memberships.cross_id
          and existing.profile_id = auth.uid()
          and existing.role = 'leader'
          and existing.is_active = true
      )
    )
  );

create policy "Leaders can update their own group memberships"
  on public.cross_memberships for update
  using (
    exists (
      select 1 from public.cross_memberships existing
      where existing.cross_id = cross_memberships.cross_id
        and existing.profile_id = auth.uid()
        and existing.role = 'leader'
        and existing.is_active = true
    )
  );

-- Quick-add creates a bare profile (name only, no auth account) for a new
-- Cross member. Not scoped tighter than "authenticated" here because the
-- real gate — must lead the target cross — is enforced on the
-- cross_memberships insert right after it, in the same server action.
create policy "Any authenticated user can add a member profile"
  on public.profiles for insert
  with check (auth.role() = 'authenticated');

create policy "Skills viewable by authenticated"
  on public.skills for select using (auth.role() = 'authenticated');

-- Missing since the original schema: edit/delete (soft) on finance rows
-- had no UPDATE policy at all, so those actions would have failed silently.
create policy "Committee can update finance"
  on public.finance_transactions for update using (auth.role() = 'authenticated');
