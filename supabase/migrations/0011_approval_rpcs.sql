-- 0011 — RPCs the app uses to read and decide account approvals.
--
-- Companion to 0010. The gate itself is the RLS policies; these just give the
-- Next.js layer a supported way to ask "am I in?" and, for an admin, "let this
-- person in" — without opening write access to account_approvals directly.
--
-- Safe to run more than once.

-- Read your own gate result. Wraps is_approved() so the app never has to
-- reimplement the rule (admin bypass included) in TypeScript.
CREATE OR REPLACE FUNCTION public.am_i_approved()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_approved();
$$;

GRANT EXECUTE ON FUNCTION public.am_i_approved() TO authenticated;

-- Approve or reject one pending account. Admin-only, checked in SQL so the
-- rule holds even if something calls this outside the dashboard.
CREATE OR REPLACE FUNCTION public.decide_account(
  p_user_id uuid,
  p_status  text,
  p_note    text DEFAULT NULL
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin_email(auth.jwt() ->> 'email') THEN
    RAISE EXCEPTION 'not_an_admin';
  END IF;

  IF p_status NOT IN ('approved', 'rejected', 'pending') THEN
    RAISE EXCEPTION 'invalid_status';
  END IF;

  -- An admin must not be able to lock themselves out mid-session.
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

REVOKE ALL ON FUNCTION public.decide_account(uuid, text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.decide_account(uuid, text, text) TO authenticated;

COMMENT ON FUNCTION public.decide_account IS
  'Admin-only: set an account to approved/rejected/pending. Refuses to demote '
  'the calling admin so the last admin cannot lock everyone out.';
