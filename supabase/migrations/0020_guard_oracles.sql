-- 0020 — Pertanyaan tentang orang lain butuh akun yang disetujui.
--
-- Sesudah 0019, tamu (anon) tidak bisa lagi memanggil fungsi-fungsi ini.
-- Tetapi siapa pun bisa masuk dengan Google dan langsung menjadi akun
-- "pending" (authenticated, belum disetujui pengurus). Akun pending itu masih
-- bisa:
--   - menebak apakah email tertentu milik admin / bendahara / tim ibadah
--     (is_admin_email, is_treasurer_email, is_ministry_email);
--   - membaca daftar id profil pengurus dan pemimpin Cross (list_pic_eligible)
--     atau menguji satu id (is_pic_eligible).
--
-- Aturan baru, sama untuk kelimanya:
--   - akun yang login boleh selalu bertanya tentang email-nya SENDIRI —
--     semua policy RLS dan get_my_app_role() hanya bertanya begitu, jadi hak
--     akses siapa pun tidak berubah;
--   - bertanya tentang orang lain butuh is_approved();
--   - pemanggil tanpa login (service_role, skrip impor, trigger dari
--     migrasi) tidak dibatasi — anon sudah ditolak di tingkat GRANT (0019).
--
-- is_approved() memanggil is_admin_email(email sendiri) → jalur "email
-- sendiri" → tidak memanggil is_approved() lagi, jadi tidak ada rekursi.
-- plpgsql dipakai (bukan sql) supaya urutan IF dijamin.
--
-- Hak EXECUTE tidak berubah (CREATE OR REPLACE mempertahankan GRANT).
-- Rollback: supabase/rollback/0020_guard_oracles.down.sql

CREATE OR REPLACE FUNCTION public.is_admin_email(p_email text)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NOT NULL
     AND lower(coalesce(p_email, '')) <> lower(coalesce(auth.jwt() ->> 'email', ''))
     AND NOT public.is_approved() THEN
    RETURN false;
  END IF;
  RETURN EXISTS (
    SELECT 1 FROM public.admin_emails WHERE email = lower(coalesce(p_email, ''))
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_treasurer_email(p_email text)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NOT NULL
     AND lower(coalesce(p_email, '')) <> lower(coalesce(auth.jwt() ->> 'email', ''))
     AND NOT public.is_approved() THEN
    RETURN false;
  END IF;
  RETURN EXISTS (
    SELECT 1 FROM public.treasurer_emails WHERE email = lower(coalesce(p_email, ''))
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_ministry_email(p_email text)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NOT NULL
     AND lower(coalesce(p_email, '')) <> lower(coalesce(auth.jwt() ->> 'email', ''))
     AND NOT public.is_approved() THEN
    RETURN false;
  END IF;
  RETURN EXISTS (
    SELECT 1 FROM public.ministry_emails WHERE email = lower(coalesce(p_email, ''))
  );
END;
$$;

-- Dropdown PIC: hanya untuk akun yang disetujui (atau pemanggil tanpa login).
CREATE OR REPLACE FUNCTION public.list_pic_eligible()
RETURNS SETOF uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT s.profile_id FROM (
    SELECT m.profile_id FROM public.cross_memberships m
    WHERE m.role = 'leader' AND m.is_active
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

-- Dipakai trigger check_event_pic (penulisnya pengurus = disetujui) dan
-- skrip tanpa login; akun pending tidak lagi bisa mengujinya satu per satu.
CREATE OR REPLACE FUNCTION public.is_pic_eligible(p_profile_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT (auth.uid() IS NULL OR public.is_approved())
    AND (
      EXISTS (
        SELECT 1 FROM public.cross_memberships m
        WHERE m.profile_id = p_profile_id
          AND m.role = 'leader'
          AND m.is_active
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
