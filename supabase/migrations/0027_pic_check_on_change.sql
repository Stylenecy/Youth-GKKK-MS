-- 0027 — Pemicu PIC hanya memeriksa PIC yang BARU; peran ganda aman dari
-- dua simpan bersamaan (18 Okt 2026, temuan kritikus teknis rilis 7).
--
-- 1. check_event_pic (0013) berjalan pada UPDATE OF pic_id, juga saat pic_id
--    dikirim ulang tanpa berubah. Sejak 0025 hanya Pengurus yang layak, jadi
--    ibadah lama yang PIC-nya pemimpin Cross tidak bisa diubah sama sekali.
--    Sekarang: diperiksa saat INSERT atau bila pic_id benar-benar berganti.
-- 2. check_single_role (0025): dua penugasan orang yang sama ke ibadah yang
--    sama pada detik yang sama bisa lolos berdua. Kunci transaksi per
--    (ibadah, orang) membuat yang kedua menunggu lalu melihat yang pertama.

CREATE OR REPLACE FUNCTION public.check_event_pic()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.pic_id IS NOT NULL
     AND (TG_OP = 'INSERT' OR NEW.pic_id IS DISTINCT FROM OLD.pic_id)
     AND NOT public.is_pic_eligible(NEW.pic_id) THEN
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

  IF NEW.status <> 'replaced' THEN
    PERFORM pg_advisory_xact_lock(
      hashtextextended(NEW.event_id::text || ':' || NEW.profile_id::text, 25)
    );
    IF EXISTS (
      SELECT 1 FROM public.steward_assignments s
      WHERE s.event_id = NEW.event_id
        AND s.profile_id = NEW.profile_id
        AND s.status <> 'replaced'
        AND s.id <> NEW.id
    ) THEN
      RAISE EXCEPTION 'already_serving_this_event' USING errcode = '23505';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- CREATE OR REPLACE mempertahankan ACL, tapi tegaskan lagi pola 0022.
REVOKE EXECUTE ON FUNCTION public.check_event_pic() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.check_single_role() FROM PUBLIC, anon, authenticated;
