-- 0022 — Fungsi pemicu (trigger) bukan RPC (Security Advisor 16 Okt 2026).
--
-- Tiga fungsi SECURITY DEFINER ini hanya dipakai sebagai pemicu, tetapi
-- role `authenticated` masih punya EXECUTE, jadi muncul di
-- /rest/v1/rpc/<nama> dan ditandai Advisor (0029):
--   - check_event_pic()   → trigger events.check_event_pic (0013)
--   - handle_new_user()   → trigger auth.users.on_auth_user_created (0010)
--   - rls_auto_enable()   → event trigger ensure_rls
-- Postgres memeriksa EXECUTE hanya saat CREATE TRIGGER, bukan saat pemicu
-- berjalan, jadi mencabutnya tidak mengubah perilaku apa pun (diuji kering:
-- .dex/db/UJI-KERING-0022-2026-10-16.md). anon/PUBLIC sudah dicabut di 0019.
-- Aplikasi tidak memanggil satu pun lewat RPC (grep src/ tests/ scripts/).
--
-- Plus: handle_updated_at() (SECURITY INVOKER, Advisor 0011) diberi
-- search_path kosong — isinya hanya now() dan NEW.
--
-- Rollback: supabase/rollback/0022_trigger_functions_not_rpc.down.sql

REVOKE EXECUTE ON FUNCTION public.check_event_pic() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM authenticated;

ALTER FUNCTION public.handle_updated_at() SET search_path = '';
