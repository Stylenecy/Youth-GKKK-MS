-- Rollback 0019 — kembalikan keadaan 4 Okt 2026 sebelum tutup-anon:
-- policy kembali TO public, EXECUTE anon (dan PUBLIC untuk 9 fungsi yang memang
-- punya grant PUBLIC, sesuai snapshot proacl 4 Okt), default privileges semula.
-- Hanya hak akses; tidak ada data yang disentuh.

ALTER POLICY "Admins decide approvals" ON public.account_approvals TO public;
ALTER POLICY "Admins read all approvals" ON public.account_approvals TO public;
ALTER POLICY "Own approval row is readable" ON public.account_approvals TO public;
ALTER POLICY "Attendance readable by committee and own leaders" ON public.attendance TO public;
ALTER POLICY "Attendance recordable by committee, PIC and leaders" ON public.attendance TO public;
ALTER POLICY "Attendance updatable by committee, PIC and leaders" ON public.attendance TO public;
ALTER POLICY "Audit logs readable by admins" ON public.audit_logs TO public;
ALTER POLICY "Cross memberships readable by approved accounts" ON public.cross_memberships TO public;
ALTER POLICY "Leaders can update their own group memberships" ON public.cross_memberships TO public;
ALTER POLICY "Crosses readable by approved accounts" ON public.crosses TO public;
ALTER POLICY "Committee can insert events" ON public.events TO public;
ALTER POLICY "Committee can update events" ON public.events TO public;
ALTER POLICY "Events readable by approved accounts" ON public.events TO public;
ALTER POLICY "Finance readable by admin and treasurer" ON public.finance_transactions TO public;
ALTER POLICY "Treasurer and admin can insert finance" ON public.finance_transactions TO public;
ALTER POLICY "Treasurer and admin can update finance" ON public.finance_transactions TO public;
ALTER POLICY "Committee can insert meetings" ON public.meeting_notes TO public;
ALTER POLICY "Meetings readable by approved accounts" ON public.meeting_notes TO public;
ALTER POLICY "Approved users can update own profile" ON public.profiles TO public;
ALTER POLICY "Profiles readable by approved accounts" ON public.profiles TO public;
ALTER POLICY "Skills readable by approved accounts" ON public.skills TO public;
ALTER POLICY "Approved members confirm own steward slot" ON public.steward_assignments TO public;
ALTER POLICY "Committee can delete steward assignments" ON public.steward_assignments TO public;
ALTER POLICY "Committee can insert steward assignments" ON public.steward_assignments TO public;
ALTER POLICY "Committee can update steward assignments" ON public.steward_assignments TO public;
ALTER POLICY "Stewards readable by approved accounts" ON public.steward_assignments TO public;

GRANT EXECUTE ON FUNCTION public.add_cross_member(uuid, text) TO anon;
GRANT EXECUTE ON FUNCTION public.am_i_approved() TO PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.check_event_pic() TO PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_cross_leadership(uuid, text) TO anon;
GRANT EXECUTE ON FUNCTION public.decide_account(uuid, text, text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_member_whatsapp(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.get_my_app_role() TO anon;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin_email(text) TO anon;
GRANT EXECUTE ON FUNCTION public.is_approved() TO PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_committee() TO PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_event_pic(uuid) TO PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_ministry_email(text) TO anon;
GRANT EXECUTE ON FUNCTION public.is_pic_eligible(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.is_treasurer_email(text) TO anon;
GRANT EXECUTE ON FUNCTION public.leads_profile(uuid) TO PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_pic_eligible() TO anon;
GRANT EXECUTE ON FUNCTION public.mark_attendance(uuid, uuid, boolean) TO anon;
GRANT EXECUTE ON FUNCTION public.my_profile_id() TO PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_audit(text, text, text, jsonb, jsonb) TO anon;
GRANT EXECUTE ON FUNCTION public.rls_auto_enable() TO PUBLIC, anon;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres GRANT EXECUTE ON FUNCTIONS TO PUBLIC;
