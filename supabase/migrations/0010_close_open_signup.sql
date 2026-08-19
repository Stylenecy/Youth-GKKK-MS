-- 0010 — Close open signup. Logging in must stop meaning "trusted".
--
-- WHAT WAS WRONG
-- Every policy in the database keyed off `auth.role() = 'authenticated'`.
-- Supabase gives that role to ANY Google account that completes the OAuth
-- flow, so the sign-in button was effectively a public registration form.
-- Verified 19 Ags 2026: an outside account signed in and could read the whole
-- database — 93 members' names, birth dates and hometowns, the cash book,
-- meeting notes, the audit log — and could also INSERT/UPDATE events and
-- INSERT meeting notes. The trigger handle_new_user() then gave them a
-- profiles row, so they also became "member #94".
--
-- WHAT THIS DOES
--   1. account_approvals: one row per login, default 'pending'.
--   2. is_approved() / is_committee(): the new gate, replacing auth.role().
--   3. Every SELECT policy now requires approval, not merely a session.
--   4. Write policies on events/meeting_notes narrowed to committee.
--   5. handle_new_user() stops minting profiles; it files an approval request.
--   6. Backfill so the existing admin is not locked out.
--
-- Safe to run more than once.

-- ---------------------------------------------------------------- 1. table
CREATE TABLE IF NOT EXISTS public.account_approvals (
  user_id      uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email        text NOT NULL,
  display_name text,
  status       text NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending', 'approved', 'rejected')),
  -- Which member of the congregation this login belongs to. Null until an
  -- admin links it; a login is not the same thing as a person on the roster.
  profile_id   uuid REFERENCES public.profiles(id),
  requested_at timestamptz NOT NULL DEFAULT now(),
  decided_at   timestamptz,
  decided_by   uuid,
  note         text
);

CREATE INDEX IF NOT EXISTS idx_account_approvals_status
  ON public.account_approvals(status);

ALTER TABLE public.account_approvals ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------ 2. the gate
-- SECURITY DEFINER so it can read account_approvals without the caller
-- needing rights on it — that also stops the policies below recursing.
CREATE OR REPLACE FUNCTION public.is_approved()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    -- Admins are approved by definition, so a misfiled approvals table can
    -- never lock the only people who could fix it out of the system.
    public.is_admin_email(auth.jwt() ->> 'email')
    OR EXISTS (
      SELECT 1 FROM public.account_approvals a
      WHERE a.user_id = auth.uid() AND a.status = 'approved'
    );
$$;

-- Who may change schedules, notes and assignments.
CREATE OR REPLACE FUNCTION public.is_committee()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_admin_email(auth.jwt() ->> 'email')
      OR public.is_treasurer_email(auth.jwt() ->> 'email')
      OR public.is_ministry_email(auth.jwt() ->> 'email');
$$;

GRANT EXECUTE ON FUNCTION public.is_approved() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_committee() TO authenticated;

-- Everyone may see the status of their OWN request (so the app can say
-- "waiting for approval"); only admins see the queue.
DROP POLICY IF EXISTS "Own approval row is readable" ON public.account_approvals;
CREATE POLICY "Own approval row is readable" ON public.account_approvals
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins read all approvals" ON public.account_approvals;
CREATE POLICY "Admins read all approvals" ON public.account_approvals
  FOR SELECT USING (public.is_admin_email(auth.jwt() ->> 'email'));

DROP POLICY IF EXISTS "Admins decide approvals" ON public.account_approvals;
CREATE POLICY "Admins decide approvals" ON public.account_approvals
  FOR UPDATE USING (public.is_admin_email(auth.jwt() ->> 'email'))
  WITH CHECK (public.is_admin_email(auth.jwt() ->> 'email'));

-- --------------------------------------------------- 3. tighten every read
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;
CREATE POLICY "Profiles readable by approved accounts" ON public.profiles
  FOR SELECT USING (public.is_approved());

-- Was `auth.uid() = id` alone, which let an unapproved account rewrite its
-- own auto-created profile — including its status field.
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Approved users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id AND public.is_approved())
  WITH CHECK (auth.uid() = id AND public.is_approved());

DROP POLICY IF EXISTS "All authenticated can view crosses" ON public.crosses;
CREATE POLICY "Crosses readable by approved accounts" ON public.crosses
  FOR SELECT USING (public.is_approved());

DROP POLICY IF EXISTS "Cross memberships viewable by authenticated" ON public.cross_memberships;
CREATE POLICY "Cross memberships readable by approved accounts" ON public.cross_memberships
  FOR SELECT USING (public.is_approved());

DROP POLICY IF EXISTS "Events viewable by all authenticated" ON public.events;
CREATE POLICY "Events readable by approved accounts" ON public.events
  FOR SELECT USING (public.is_approved());

DROP POLICY IF EXISTS "Stewards viewable by all authenticated" ON public.steward_assignments;
CREATE POLICY "Stewards readable by approved accounts" ON public.steward_assignments
  FOR SELECT USING (public.is_approved());

DROP POLICY IF EXISTS "Skills viewable by authenticated" ON public.skills;
CREATE POLICY "Skills readable by approved accounts" ON public.skills
  FOR SELECT USING (public.is_approved());

DROP POLICY IF EXISTS "Finance viewable by authenticated" ON public.finance_transactions;
CREATE POLICY "Finance readable by approved accounts" ON public.finance_transactions
  FOR SELECT USING (public.is_approved());

DROP POLICY IF EXISTS "All authenticated can view meetings" ON public.meeting_notes;
CREATE POLICY "Meetings readable by approved accounts" ON public.meeting_notes
  FOR SELECT USING (public.is_approved());

DROP POLICY IF EXISTS "Audit logs viewable by authenticated" ON public.audit_logs;
CREATE POLICY "Audit logs readable by admins" ON public.audit_logs
  FOR SELECT USING (public.is_admin_email(auth.jwt() ->> 'email'));

-- -------------------------------------------------- 4. tighten every write
-- Anyone with a session could previously add or edit a gathering.
DROP POLICY IF EXISTS "Committee can insert events" ON public.events;
CREATE POLICY "Committee can insert events" ON public.events
  FOR INSERT WITH CHECK (public.is_committee());

DROP POLICY IF EXISTS "Committee can update events" ON public.events;
CREATE POLICY "Committee can update events" ON public.events
  FOR UPDATE USING (public.is_committee()) WITH CHECK (public.is_committee());

DROP POLICY IF EXISTS "Committee can insert meetings" ON public.meeting_notes;
CREATE POLICY "Committee can insert meetings" ON public.meeting_notes
  FOR INSERT WITH CHECK (public.is_committee());

-- Confirming your own steward slot stays self-service, but only once approved.
DROP POLICY IF EXISTS "Members can update own steward status (confirm)" ON public.steward_assignments;
CREATE POLICY "Approved members confirm own steward slot" ON public.steward_assignments
  FOR UPDATE USING (auth.uid() = profile_id AND public.is_approved())
  WITH CHECK (auth.uid() = profile_id AND public.is_approved());

-- --------------------------------------------------------- 5. the trigger
-- No longer creates a profile. A Google login is a request for access, not
-- evidence of being part of the congregation — conflating the two is exactly
-- how an outside account became "member #94".
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

-- ----------------------------------------------------------- 6. backfill
-- Existing logins get an approvals row so nobody is left in limbo. Admins
-- land as 'approved'; everyone else must be decided on deliberately.
INSERT INTO public.account_approvals (user_id, email, display_name, status, decided_at, note)
SELECT
  u.id,
  COALESCE(u.email, ''),
  COALESCE(u.raw_user_meta_data ->> 'full_name', u.email),
  CASE WHEN public.is_admin_email(u.email) THEN 'approved' ELSE 'pending' END,
  CASE WHEN public.is_admin_email(u.email) THEN now() ELSE NULL END,
  'Backfill migrasi 0010 (pendaftaran terbuka ditutup).'
FROM auth.users u
ON CONFLICT (user_id) DO NOTHING;
