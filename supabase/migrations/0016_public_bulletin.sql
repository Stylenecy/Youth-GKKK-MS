-- 0016 — Warta publik untuk halaman depan (tamu tanpa login).
--
-- KENAPA: tabel events, crosses, dan steward_assignments hanya bisa dibaca
-- akun yang disetujui (RLS is_approved(), 0010). Halaman depan dibuka tamu,
-- jadi selama ini bagian "Warta" dan "Agenda" selalu kosong untuk publik
-- walau datanya ada (audit 4 Okt 2026).
--
-- Fungsi ini membuka SATU jalur baca-saja dengan kolom warta yang memang
-- untuk umum — tidak membuka tabelnya:
--   * acara mendatang (maks 5) yang tidak diarsipkan: tanggal, tema, jenis,
--     status. Pembicara + deskripsi hanya untuk acara berstatus published
--     (draf bisa berisi catatan internal);
--   * jumlah petugas per peran untuk acara itu — angka saja, TANPA nama,
--     id profil, atau nomor;
--   * acara terakhir yang sudah lewat (tanggal, tema, jenis);
--   * kelompok Cross aktif: nama, deskripsi, hari, jam (tanpa pemimpin);
--   * hitungan agregat (acara, tugas penatalayan, anggota aktif, Cross).
--
-- SECURITY DEFINER + search_path tetap: fungsi membaca tabel sebagai
-- pemiliknya, lalu hanya mengembalikan kolom di atas. Migrasi tutup-anon
-- berikutnya (REVOKE EXECUTE dari anon untuk fungsi SECURITY DEFINER lain)
-- WAJIB mengecualikan fungsi ini.
--
-- Rollback: supabase/rollback/0016_public_bulletin.down.sql
-- Aman dijalankan lebih dari sekali.

CREATE OR REPLACE FUNCTION public.public_bulletin()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  WITH live AS (
    SELECT e.id, e.date, e.weekly_theme, e.event_type, e.speaker_name,
           e.description, e.status
    FROM public.events e
    WHERE e.status <> 'archived' AND e.archived_at IS NULL
  ),
  upcoming AS (
    SELECT * FROM live WHERE date >= now() ORDER BY date ASC LIMIT 5
  ),
  latest AS (
    SELECT * FROM live WHERE date < now() ORDER BY date DESC LIMIT 1
  )
  SELECT jsonb_build_object(
    'generated_at', now(),
    'upcoming', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'date', u.date,
          'theme', u.weekly_theme,
          'type', u.event_type,
          'status', u.status,
          'speaker', CASE WHEN u.status = 'published' THEN u.speaker_name END,
          'description', CASE WHEN u.status = 'published' THEN u.description END,
          'roles', COALESCE((
            SELECT jsonb_object_agg(r.role, r.n)
            FROM (
              SELECT s.role, count(*) AS n
              FROM public.steward_assignments s
              WHERE s.event_id = u.id AND s.status <> 'replaced'
              GROUP BY s.role
            ) r
          ), '{}'::jsonb)
        )
        ORDER BY u.date
      )
      FROM upcoming u
    ), '[]'::jsonb),
    'latest', (
      SELECT jsonb_build_object(
        'date', l.date, 'theme', l.weekly_theme, 'type', l.event_type
      )
      FROM latest l
    ),
    'crosses', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'name', c.name,
          'description', c.description,
          'day', c.meeting_day,
          'time', c.meeting_time
        )
        ORDER BY c.name
      )
      FROM public.crosses c
      WHERE c.is_active
    ), '[]'::jsonb),
    'counts', jsonb_build_object(
      'events', (SELECT count(*) FROM live),
      'assignments', (
        SELECT count(*)
        FROM public.steward_assignments s
        JOIN live l ON l.id = s.event_id
        WHERE s.status <> 'replaced'
      ),
      'members', (SELECT count(*) FROM public.profiles WHERE is_active),
      'crosses', (SELECT count(*) FROM public.crosses WHERE is_active)
    )
  );
$$;

REVOKE ALL ON FUNCTION public.public_bulletin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_bulletin() TO anon, authenticated;

COMMENT ON FUNCTION public.public_bulletin() IS
  'Warta publik halaman depan: jadwal + hitungan, tanpa data pribadi (4 Okt 2026). Dikecualikan dari migrasi tutup-anon.';
