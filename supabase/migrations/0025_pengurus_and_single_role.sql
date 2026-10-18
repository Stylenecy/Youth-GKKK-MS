-- 0025 — Penanda Pengurus + satu peran per orang per ibadah (18 Okt 2026)
--
-- Masukan Nathan lewat Dex (18 Okt): PIC ibadah "cukup Pengurus aja", dan
-- pemilih petugas tidak boleh memberi satu orang dua peran di hari yang sama.
--
-- 1. profiles.is_pengurus — siapa Pengurus Komisi Pemuda sekarang. Selama ini
--    "boleh jadi PIC" diturunkan dari pemimpin Cross + akun pengurus yang
--    tertaut (0013). Akun belum ada yang tertaut, jadi daftar PIC = 8 pemimpin
--    Cross, termasuk satu yang bukan Pengurus. Penanda eksplisit ini yang
--    sekarang menentukan PIC; admin mengubahnya lewat set_pengurus().
--    Isi awal: Pengurus 2026–2028 (Dex-Brain 30-RELASI/01-GRUP.md), dicocokkan
--    dengan nama lengkap persis.
-- 2. Peran ganda: pemicu menolak penugasan BARU (atau yang dipindah) bila orang
--    itu sudah bertugas di ibadah yang sama. Dua pasang lama (16 Mei, 27 Jun)
--    tidak disentuh — pemicu hanya memeriksa baris yang sedang ditulis.

-- 1a. Kolom. Pengguna biasa tidak bisa mengubahnya: hak UPDATE profiles per
--     kolom (0024) tidak mencakup kolom baru, dan tidak ada kebijakan INSERT.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_pengurus boolean NOT NULL DEFAULT false;

GRANT SELECT (is_pengurus) ON public.profiles TO authenticated;

UPDATE public.profiles
SET is_pengurus = true
WHERE is_active
  AND full_name IN (
    'Martha Angelina Gunawan',
    'Nathanael Sugianto',
    'Erica Celine Christer',
    'Benita Antonia Naomi Ruhulessin',
    'Grace Cantika Putri',
    'Arion Sudibyo',
    'Dex Bennett'
  );

-- 1b. PIC = Pengurus (penanda) atau akun pengurus yang tertaut. Pemimpin Cross
--     tidak lagi otomatis boleh jadi PIC.
CREATE OR REPLACE FUNCTION public.is_pic_eligible(p_profile_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT (auth.uid() IS NULL OR public.is_approved())
    AND (
      EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = p_profile_id AND p.is_pengurus AND p.is_active
      ) OR EXISTS (
        SELECT 1 FROM public.account_approvals a
        WHERE a.profile_id = p_profile_id
          AND a.status = 'approved'
          AND (
            public.is_admin_email(a.email)
            OR public.is_treasurer_email(a.email)
            OR public.is_ministry_email(a.email)
          )
      )
    );
$$;

CREATE OR REPLACE FUNCTION public.list_pic_eligible()
RETURNS SETOF uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT s.profile_id FROM (
    SELECT p.id AS profile_id FROM public.profiles p
    WHERE p.is_pengurus AND p.is_active
    UNION
    SELECT a.profile_id FROM public.account_approvals a
    WHERE a.profile_id IS NOT NULL
      AND a.status = 'approved'
      AND (
        public.is_admin_email(a.email)
        OR public.is_treasurer_email(a.email)
        OR public.is_ministry_email(a.email)
      )
  ) s
  WHERE auth.uid() IS NULL OR public.is_approved();
$$;

-- 1c. Admin menandai / mencabut Pengurus (pergantian kepengurusan tiap 2 tahun).
CREATE OR REPLACE FUNCTION public.set_pengurus(p_profile_id uuid, p_value boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_old boolean;
BEGIN
  IF NOT public.is_admin_email(auth.jwt() ->> 'email') THEN
    RAISE EXCEPTION 'not_an_admin' USING errcode = '42501';
  END IF;

  SELECT is_pengurus INTO v_old FROM public.profiles WHERE id = p_profile_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'profile_not_found' USING errcode = 'P0002';
  END IF;

  IF v_old IS DISTINCT FROM p_value THEN
    UPDATE public.profiles SET is_pengurus = p_value WHERE id = p_profile_id;
    PERFORM public.record_audit(
      'update', 'profile', p_profile_id::text,
      jsonb_build_object('is_pengurus', v_old),
      jsonb_build_object('is_pengurus', p_value)
    );
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.set_pengurus(uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_pengurus(uuid, boolean) TO authenticated;

-- 2. Satu orang, satu peran per ibadah.
CREATE OR REPLACE FUNCTION public.check_single_role()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- Mengonfirmasi atau mengubah status baris lama tanpa memindahkannya tidak
  -- diperiksa: dua pasang ganda lama tetap bisa dikonfirmasi.
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

-- Fungsi pemicu bukan RPC (pola 0022).
REVOKE EXECUTE ON FUNCTION public.check_single_role() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS check_single_role ON public.steward_assignments;
CREATE TRIGGER check_single_role
  BEFORE INSERT OR UPDATE OF event_id, profile_id, status ON public.steward_assignments
  FOR EACH ROW EXECUTE FUNCTION public.check_single_role();
