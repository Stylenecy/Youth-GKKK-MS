-- 0018 — Warta publik tanpa nama pembicara.
--
-- KENAPA: aturan halaman publik YGMS = tanpa nama orang kecuali Dex memutuskan
-- lain (0017). Kolom speaker_name adalah nama orang, jadi tidak lagi dikirim ke
-- tamu. Teks yang ditulis pengurus untuk acara berstatus published (tema,
-- deskripsi) tetap tampil apa adanya. Nama pembicara tetap terlihat di dashboard.
--
-- Rollback: supabase/rollback/0018_public_bulletin_no_speaker.down.sql
-- (kembali ke versi 0017). Aman dijalankan lebih dari sekali.

CREATE OR REPLACE FUNCTION public.public_bulletin()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  WITH live AS (
    SELECT e.id, e.date, e.weekly_theme, e.event_type, e.description, e.status
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
    'cross_schedule', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object('day', s.day, 'time', s.time, 'groups', s.n)
        ORDER BY s.n DESC, s.day, s.time
      )
      FROM (
        SELECT c.meeting_day AS day, c.meeting_time AS time, count(*) AS n
        FROM public.crosses c
        WHERE c.is_active
        GROUP BY c.meeting_day, c.meeting_time
      ) s
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
  'Warta publik halaman depan: jadwal + hitungan, tanpa nama orang (0018, 4 Okt 2026). Dikecualikan dari migrasi tutup-anon.';
