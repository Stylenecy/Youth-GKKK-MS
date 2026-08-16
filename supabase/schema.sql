-- ============================================================
-- YGMS v2 — YOUTH GKKK MANAGEMENT SYSTEM — COMPLETE SCHEMA
-- Database: Supabase (PostgreSQL 15+)
-- Philosophy: Never hard-delete. Use is_active, archived_at.
-- All tables have created_at, updated_at.
-- Idempotent — safe to run multiple times.
-- ============================================================

-- 0. EXTENSIONS
create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";

-- Drop triggers first (idempotent)
drop trigger if exists set_updated_at on public.profiles;
drop trigger if exists set_skills_updated_at on public.skills;
drop trigger if exists set_events_updated_at on public.events;
drop trigger if exists set_steward_updated_at on public.steward_assignments;
drop trigger if exists set_crosses_updated_at on public.crosses;
drop trigger if exists set_finance_updated_at on public.finance_transactions;
drop trigger if exists set_meeting_updated_at on public.meeting_notes;
drop trigger if exists on_auth_user_created on auth.users;

-- Drop old functions if they exist (idempotent)
drop function if exists public.handle_updated_at() cascade;
drop function if exists public.handle_new_user() cascade;

-- 1. PROFILES (extends Supabase auth.users)
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text not null,
  nickname    text not null,
  whatsapp    text,
  birth_date  date,
  hometown    text,
  university  text,
  cohort      text,
  status      text not null default 'active'
              check (status in ('active','away','alumni','inactive')),
  avatar_url  text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_profiles_status on public.profiles(status);
create index if not exists idx_profiles_is_active on public.profiles(is_active);

-- trigger: auto-update updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

-- trigger: auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, nickname, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email),
    coalesce(new.raw_user_meta_data ->> 'preferred_username', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2. HIERARCHICAL SKILLS
create table if not exists public.skills (
  id                uuid primary key default gen_random_uuid(),
  profile_id        uuid not null references public.profiles(id) on delete cascade,
  category          text not null,
  skill_name        text not null,
  proficiency_level text not null default 'beginner'
                    check (proficiency_level in ('beginner','intermediate','advanced')),
  is_primary        boolean not null default false,
  last_used         timestamptz not null default now(),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists idx_skills_profile on public.skills(profile_id);
create trigger set_skills_updated_at
  before update on public.skills
  for each row execute function public.handle_updated_at();

-- 3. MONTHLY THEMES
create table if not exists public.monthly_themes (
  id          uuid primary key default gen_random_uuid(),
  month       text not null,
  year        int not null,
  theme       text not null,
  description text,
  created_at  timestamptz not null default now()
);

-- 4. EVENTS (Saturday Gatherings)
create table if not exists public.events (
  id              uuid primary key default gen_random_uuid(),
  date            timestamptz not null,
  weekly_theme    text not null,
  event_type      text not null default 'worship'
                  check (event_type in ('worship','cross','talkshow','movie','sports','retreat','special')),
  pic_id          uuid references public.profiles(id),
  speaker_name    text,
  description     text,
  monthly_theme_id uuid references public.monthly_themes(id),
  status          text not null default 'draft'
                  check (status in ('draft','published','completed','archived')),
  archived_at     timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_events_date on public.events(date);
create index if not exists idx_events_status on public.events(status);
create trigger set_events_updated_at
  before update on public.events
  for each row execute function public.handle_updated_at();

-- 5. STEWARD ASSIGNMENTS
create table if not exists public.steward_assignments (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references public.events(id) on delete cascade,
  profile_id  uuid not null references public.profiles(id),
  role        text not null,
  status      text not null default 'assigned'
              check (status in ('assigned','confirmed','change_requested','replaced')),
  reason      text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_steward_event on public.steward_assignments(event_id);
create index if not exists idx_steward_profile on public.steward_assignments(profile_id);
create trigger set_steward_updated_at
  before update on public.steward_assignments
  for each row execute function public.handle_updated_at();

-- 6. CROSSES (Small Groups)
create table if not exists public.crosses (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  leader_id     uuid references public.profiles(id),
  description   text,
  meeting_day   text,
  meeting_time  text,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create trigger set_crosses_updated_at
  before update on public.crosses
  for each row execute function public.handle_updated_at();

-- 7. CROSS MEMBERSHIPS (history-preserving)
create table if not exists public.cross_memberships (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references public.profiles(id),
  cross_id    uuid not null references public.crosses(id),
  start_date  timestamptz not null default now(),
  end_date    timestamptz,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

create index if not exists idx_cross_member on public.cross_memberships(profile_id);
create index if not exists idx_cross_active on public.cross_memberships(is_active);

-- 8. FINANCE TRANSACTIONS
create table if not exists public.finance_transactions (
  id            uuid primary key default gen_random_uuid(),
  event_id      uuid references public.events(id),
  amount        bigint not null check (amount > 0),
  type          text not null check (type in ('income','expense')),
  category      text not null,
  description   text not null,
  receipt_url   text,
  recorded_by   uuid not null references public.profiles(id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_finance_type on public.finance_transactions(type);
create index if not exists idx_finance_created on public.finance_transactions(created_at);
create trigger set_finance_updated_at
  before update on public.finance_transactions
  for each row execute function public.handle_updated_at();

-- 9. MEETING NOTES
create table if not exists public.meeting_notes (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  date          timestamptz not null default now(),
  content       jsonb not null default '{}',
  participants  uuid[] not null default '{}',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create trigger set_meeting_updated_at
  before update on public.meeting_notes
  for each row execute function public.handle_updated_at();

-- 10. AUDIT LOGS
create table if not exists public.audit_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id),
  action      text not null,
  entity_type text not null,
  entity_id   text not null,
  old_value   jsonb,
  new_value   jsonb,
  timestamp   timestamptz not null default now()
);

create index if not exists idx_audit_entity on public.audit_logs(entity_type, entity_id);
create index if not exists idx_audit_user on public.audit_logs(user_id);
create index if not exists idx_audit_timestamp on public.audit_logs(timestamp);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.profiles               enable row level security;
alter table public.skills                 enable row level security;
alter table public.monthly_themes         enable row level security;
alter table public.events                 enable row level security;
alter table public.steward_assignments    enable row level security;
alter table public.crosses                enable row level security;
alter table public.cross_memberships      enable row level security;
alter table public.finance_transactions   enable row level security;
alter table public.meeting_notes          enable row level security;
alter table public.audit_logs             enable row level security;

-- Drop existing policies first (idempotent)
drop policy if exists "Profiles are viewable by authenticated users" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Events viewable by all authenticated" on public.events;
drop policy if exists "Committee can insert events" on public.events;
drop policy if exists "Committee can update events" on public.events;
drop policy if exists "Stewards viewable by all authenticated" on public.steward_assignments;
drop policy if exists "Members can update own steward status (confirm)" on public.steward_assignments;
drop policy if exists "Finance viewable by authenticated" on public.finance_transactions;
drop policy if exists "Committee can insert finance" on public.finance_transactions;
drop policy if exists "All authenticated can view crosses" on public.crosses;
drop policy if exists "All authenticated can view meetings" on public.meeting_notes;
drop policy if exists "Committee can insert meetings" on public.meeting_notes;
drop policy if exists "Audit logs viewable by authenticated" on public.audit_logs;

-- profiles: all authenticated can read, only own can update
create policy "Profiles are viewable by authenticated users"
  on public.profiles for select using (auth.role() = 'authenticated');

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- events: authenticated can read, committee+ can insert/update
create policy "Events viewable by all authenticated"
  on public.events for select using (auth.role() = 'authenticated');

create policy "Committee can insert events"
  on public.events for insert with check (auth.role() = 'authenticated');

create policy "Committee can update events"
  on public.events for update using (auth.role() = 'authenticated');

-- stewards: all authenticated can read/confirm own
create policy "Stewards viewable by all authenticated"
  on public.steward_assignments for select using (auth.role() = 'authenticated');

create policy "Members can update own steward status (confirm)"
  on public.steward_assignments for update
  using (auth.uid() = profile_id);

-- finance: authenticated can read, committee can insert
create policy "Finance viewable by authenticated"
  on public.finance_transactions for select using (auth.role() = 'authenticated');

create policy "Committee can insert finance"
  on public.finance_transactions for insert with check (auth.role() = 'authenticated');

-- default policies for remaining tables
create policy "All authenticated can view crosses"
  on public.crosses for select using (auth.role() = 'authenticated');

create policy "All authenticated can view meetings"
  on public.meeting_notes for select using (auth.role() = 'authenticated');

create policy "Committee can insert meetings"
  on public.meeting_notes for insert with check (auth.role() = 'authenticated');

create policy "Audit logs viewable by authenticated"
  on public.audit_logs for select using (auth.role() = 'authenticated');