-- 0009 — Give a profile somewhere to keep the "Keterangan" from the roster.
--
-- WHY THIS EXISTS
-- The member spreadsheet records a short reason next to people who are not
-- attending regularly ("Kuliah di luar", "Pindah gereja", "Ke Belanda",
-- "Skripsi"). The importer only ever read the ANGGOTA PEMUDA sheet, where that
-- column does not exist — it lives on the ABSENSI sheet — so every one of the
-- 93 imported members landed as status 'active' with the reason discarded.
--
-- Status alone loses the useful half of that: knowing someone is 'away' is far
-- less helpful to a pengurus than knowing they are away *because they are
-- studying abroad*. This column keeps the original wording.
--
-- Safe to run more than once.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS notes text;

COMMENT ON COLUMN public.profiles.notes IS
  'Free-text context from the roster''s Keterangan column, e.g. why someone is '
  'currently away. Shown to signed-in pengurus alongside status.';
