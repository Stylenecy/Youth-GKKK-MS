-- 0013 — PIC harus pengurus.
--
-- Keputusan Dex, 19 Sep 2026: Penanggung Jawab (PIC) ibadah hanya boleh
-- pengurus — yaitu pengurus inti (admin/treasurer/ministry, berbasis email)
-- atau pemimpin Cross yang masih aktif. Sebelum migrasi ini, pic_id hanya
-- foreign key ke profiles(id): anggota biasa yang login dan disetujui bisa
-- dijadikan PIC, dan tidak ada satu pun lapisan (UI, server action, maupun
-- database) yang memeriksa peran targetnya.
--
-- Aturannya hidup di SQL (trigger) sehingga berlaku tidak peduli siapa yang
-- memanggil: aplikasi, REST langsung, maupun skrip impor. Aplikasi tetap
-- memvalidasi duluan supaya pesannya ramah ("PIC harus pengurus"), bukan
-- pesan mentah trigger — trigger adalah jaring pengaman terakhir.
--
-- Safe to run more than once. Baris lama tidak disentuh: trigger hanya
-- berjalan saat pic_id di-INSERT atau di-UPDATE.

-- Layak jadi PIC: pemimpin Cross aktif, ATAU login committee yang tertaut
-- ke baris roster (account_approvals.profile_id diisi admin saat menyetujui).
CREATE OR REPLACE FUNCTION public.is_pic_eligible(p_profile_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
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
  );
$$;

-- Daftar id yang layak, untuk mengisi dropdown PIC di aplikasi.
CREATE OR REPLACE FUNCTION public.list_pic_eligible()
RETURNS SETOF uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
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
    );
$$;

REVOKE ALL ON FUNCTION public.is_pic_eligible(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.is_pic_eligible(uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.list_pic_eligible() FROM public;
GRANT EXECUTE ON FUNCTION public.list_pic_eligible() TO authenticated;

-- Jaring pengaman terakhir: tolak pic_id yang bukan pengurus.
CREATE OR REPLACE FUNCTION public.check_event_pic()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.pic_id IS NOT NULL AND NOT public.is_pic_eligible(NEW.pic_id) THEN
    RAISE EXCEPTION 'pic_must_be_pengurus';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS check_event_pic ON public.events;
CREATE TRIGGER check_event_pic
  BEFORE INSERT OR UPDATE OF pic_id ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.check_event_pic();

COMMENT ON FUNCTION public.is_pic_eligible IS
  'Benar bila profil adalah pemimpin Cross aktif atau login committee yang tertaut (keputusan Dex, 19 Sep 2026).';
