-- 0026 — set_pengurus() menulis Audit dalam kalimat, bukan kata "update"
-- (18 Okt 2026). Halaman Audit menampilkan kolom action apa adanya, dan
-- aksi lain menulis kalimat ("Menautkan akun ke data anggota"). Kode galat
-- admin dibuat khusus supaya pesannya tidak berbunyi "menyetujui akun".

CREATE OR REPLACE FUNCTION public.set_pengurus(p_profile_id uuid, p_value boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_old boolean;
BEGIN
  IF NOT public.is_admin_email(auth.jwt() ->> 'email') THEN
    RAISE EXCEPTION 'only_admin_sets_pengurus' USING errcode = '42501';
  END IF;

  SELECT is_pengurus INTO v_old FROM public.profiles WHERE id = p_profile_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'profile_not_found' USING errcode = 'P0002';
  END IF;

  IF v_old IS DISTINCT FROM p_value THEN
    UPDATE public.profiles SET is_pengurus = p_value WHERE id = p_profile_id;
    PERFORM public.record_audit(
      CASE WHEN p_value THEN 'Menandai anggota sebagai Pengurus'
           ELSE 'Mencabut tanda Pengurus dari anggota' END,
      'profile', p_profile_id::text,
      jsonb_build_object('is_pengurus', v_old),
      jsonb_build_object('is_pengurus', p_value)
    );
  END IF;
END;
$$;
