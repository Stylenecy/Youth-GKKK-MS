-- 0008 — Make the audit trail actually recordable.
--
-- WHY THIS EXISTS
-- `audit_logs` has existed since schema.sql and the dashboard has always had
-- an "Audit" page reading from it, but the table had only a SELECT policy —
-- no INSERT policy at all — and no application code ever wrote to it. So the
-- page was guaranteed to stay empty forever. Verified 19 Ags 2026: 0 rows.
--
-- WHAT THIS DOES
-- Adds a SECURITY DEFINER function the app calls instead of inserting
-- directly. Going through a function rather than opening an INSERT policy
-- means a signed-in user cannot forge a log line attributed to someone else:
-- the actor is taken from auth.uid() inside SQL, never from the client.
--
-- Safe to run more than once.

CREATE OR REPLACE FUNCTION public.record_audit(
  p_action      text,
  p_entity_type text,
  p_entity_id   text,
  p_old_value   jsonb DEFAULT NULL,
  p_new_value   jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  -- Not signed in: nothing to attribute, so record nothing. Deliberately not
  -- an exception — an audit failure must never break the action being audited.
  IF v_uid IS NULL THEN
    RETURN;
  END IF;

  -- audit_logs.user_id is a FK to profiles. A freshly signed-in Google account
  -- may not have its profile row yet; skip rather than blow up the caller.
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_uid) THEN
    RETURN;
  END IF;

  INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, old_value, new_value)
  VALUES (v_uid, p_action, p_entity_type, p_entity_id, p_old_value, p_new_value);
END;
$$;

REVOKE ALL ON FUNCTION public.record_audit(text, text, text, jsonb, jsonb) FROM public;
GRANT EXECUTE ON FUNCTION public.record_audit(text, text, text, jsonb, jsonb) TO authenticated;

COMMENT ON FUNCTION public.record_audit IS
  'Append one audit row attributed to the caller (auth.uid()). Never raises: '
  'a failed audit must not roll back the action it was recording.';
