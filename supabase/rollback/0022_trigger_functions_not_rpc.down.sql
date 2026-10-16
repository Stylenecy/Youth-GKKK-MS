-- Rollback 0022 — kembalikan EXECUTE untuk authenticated dan search_path
-- handle_updated_at seperti sebelum 0022 (keadaan produksi 16 Okt 2026).
GRANT EXECUTE ON FUNCTION public.check_event_pic() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.rls_auto_enable() TO authenticated;
ALTER FUNCTION public.handle_updated_at() RESET search_path;
