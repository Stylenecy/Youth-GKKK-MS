-- Rollback 0027 — pemicu kembali ke versi 0013 (check_event_pic) dan 0025
-- (check_single_role, tanpa kunci).

CREATE OR REPLACE FUNCTION public.check_event_pic()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.pic_id IS NOT NULL AND NOT public.is_pic_eligible(NEW.pic_id) THEN
    RAISE EXCEPTION 'pic_must_be_pengurus';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_single_role()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'UPDATE'
     AND NEW.event_id = OLD.event_id
     AND NEW.profile_id = OLD.profile_id
     AND OLD.status <> 'replaced' THEN
    RETURN NEW;
  END IF;
  IF NEW.status <> 'replaced' AND EXISTS (
    SELECT 1 FROM public.steward_assignments s
    WHERE s.event_id = NEW.event_id
      AND s.profile_id = NEW.profile_id
      AND s.status <> 'replaced'
      AND s.id <> NEW.id
  ) THEN
    RAISE EXCEPTION 'already_serving_this_event' USING errcode = '23505';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.check_event_pic() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.check_single_role() FROM PUBLIC, anon, authenticated;
