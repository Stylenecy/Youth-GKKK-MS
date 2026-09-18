-- 0012 — Attendance (absensi).
--
-- Policy decisions are Dex's, taken 19 Ags 2026, and encoded here rather than
-- in the UI so they hold no matter what calls the database:
--   * VIEW   — committee (admin/treasurer/ministry) see everyone; a Cross
--              leader sees only their own group's members. Ordinary members
--              see nothing, not even themselves. Attendance is pastoral care
--              data, not a leaderboard.
--   * RECORD — committee, the PIC of that gathering, and Cross leaders (their
--              own members only).
--   * SCOPE  — Ibadah Pemuda; one row per (event, person).
--
-- Safe to run more than once.

-- ------------------------------------------------- who am I, as a member?
-- A login and a roster row are different things: the 93 imported members have
-- generated ids, while an account created by the old trigger had id =
-- auth.uid(). account_approvals.profile_id is the link. Until an admin sets
-- it, fall back to auth.uid() so existing behaviour is unchanged.
CREATE OR REPLACE FUNCTION public.my_profile_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(
    (SELECT a.profile_id FROM public.account_approvals a
      WHERE a.user_id = auth.uid() AND a.status = 'approved'),
    auth.uid()
  );
$$;

-- Do I lead a Cross that this person is an active member of?
CREATE OR REPLACE FUNCTION public.leads_profile(p_profile_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.cross_memberships mine
    JOIN public.cross_memberships theirs ON theirs.cross_id = mine.cross_id
    WHERE mine.profile_id = public.my_profile_id()
      AND mine.role = 'leader'
      AND mine.is_active
      AND theirs.profile_id = p_profile_id
      AND theirs.is_active
  );
$$;

-- Am I the person in charge of this gathering?
CREATE OR REPLACE FUNCTION public.is_event_pic(p_event_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = p_event_id AND e.pic_id = public.my_profile_id()
  );
$$;

GRANT EXECUTE ON FUNCTION public.my_profile_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.leads_profile(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_event_pic(uuid) TO authenticated;

-- ---------------------------------------------------------------- table
CREATE TABLE IF NOT EXISTS public.attendance (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id    uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  profile_id  uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  present     boolean NOT NULL DEFAULT true,
  note        text,
  recorded_by uuid,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  -- One verdict per person per gathering; makes the tick-box an idempotent
  -- upsert instead of a growing pile of duplicate rows.
  UNIQUE (event_id, profile_id)
);

CREATE INDEX IF NOT EXISTS idx_attendance_event   ON public.attendance(event_id);
CREATE INDEX IF NOT EXISTS idx_attendance_profile ON public.attendance(profile_id);

DROP TRIGGER IF EXISTS set_attendance_updated_at ON public.attendance;
CREATE TRIGGER set_attendance_updated_at
  BEFORE UPDATE ON public.attendance
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------- policies
DROP POLICY IF EXISTS "Attendance readable by committee and own leaders" ON public.attendance;
CREATE POLICY "Attendance readable by committee and own leaders" ON public.attendance
  FOR SELECT USING (
    public.is_committee() OR public.leads_profile(profile_id)
  );

DROP POLICY IF EXISTS "Attendance recordable by committee, PIC and leaders" ON public.attendance;
CREATE POLICY "Attendance recordable by committee, PIC and leaders" ON public.attendance
  FOR INSERT WITH CHECK (
    public.is_committee()
    OR public.is_event_pic(event_id)
    OR public.leads_profile(profile_id)
  );

DROP POLICY IF EXISTS "Attendance updatable by committee, PIC and leaders" ON public.attendance;
CREATE POLICY "Attendance updatable by committee, PIC and leaders" ON public.attendance
  FOR UPDATE USING (
    public.is_committee()
    OR public.is_event_pic(event_id)
    OR public.leads_profile(profile_id)
  ) WITH CHECK (
    public.is_committee()
    OR public.is_event_pic(event_id)
    OR public.leads_profile(profile_id)
  );

-- ------------------------------------------------------------------ rpc
-- One tick from the phone. SECURITY DEFINER so the permission rule lives in
-- SQL, and so a leader ticking their own member does not need blanket write
-- rights on the table.
CREATE OR REPLACE FUNCTION public.mark_attendance(
  p_event_id   uuid,
  p_profile_id uuid,
  p_present    boolean
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT (
    public.is_committee()
    OR public.is_event_pic(p_event_id)
    OR public.leads_profile(p_profile_id)
  ) THEN
    RAISE EXCEPTION 'not_allowed_to_record';
  END IF;

  INSERT INTO public.attendance (event_id, profile_id, present, recorded_by)
  VALUES (p_event_id, p_profile_id, p_present, auth.uid())
  ON CONFLICT (event_id, profile_id) DO UPDATE
    SET present     = EXCLUDED.present,
        recorded_by = EXCLUDED.recorded_by,
        updated_at  = now();
END;
$$;

REVOKE ALL ON FUNCTION public.mark_attendance(uuid, uuid, boolean) FROM public;
GRANT EXECUTE ON FUNCTION public.mark_attendance(uuid, uuid, boolean) TO authenticated;

COMMENT ON TABLE public.attendance IS
  'Kehadiran per ibadah. Terlihat hanya oleh pengurus dan pemimpin Cross '
  'atas anggotanya sendiri (keputusan Dex, 19 Ags 2026).';
