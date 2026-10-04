-- 0019 — Tutup jalur tamu (anon) ke aturan akses dan fungsi SECURITY DEFINER.
--
-- KENAPA (audit Security Advisor 19 Sep + 4 Okt 2026): 21 fungsi SECURITY
-- DEFINER bisa dipanggil anon. Yang nyata bocor ke tamu:
--   * is_admin_email / is_treasurer_email / is_ministry_email = "oracle":
--     tamu bisa menebak alamat email pengurus satu per satu;
--   * list_pic_eligible membocorkan daftar UUID pemimpin dan pengurus.
-- Fungsi lain sudah gagal-tertutup untuk anon (auth.uid() null), tapi tetap
-- tidak ada alasan tamu memanggilnya.
--
-- JEBAKAN: ke-26 policy RLS dibuat `TO public`, jadi juga dievaluasi untuk
-- anon dan memanggil is_approved()/is_committee()/is_*_email(). Mencabut
-- EXECUTE saja akan membuat setiap query anon berubah dari "0 baris" menjadi
-- galat. Urutannya karena itu:
--   (a) semua policy dipersempit ke `authenticated` — untuk anon tidak ada
--       policy yang berlaku, RLS menolak diam-diam (0 baris), tanpa memanggil
--       fungsi apa pun;
--   (b) EXECUTE dicabut dari PUBLIC dan anon untuk 21 fungsi (authenticated
--       tetap boleh: policy-nya memanggil fungsi ini);
--   (c) fungsi baru milik postgres di schema public tidak lagi otomatis bisa
--       dipanggil anon/PUBLIC — grant harus ditulis eksplisit.
-- public_bulletin() (0016/0017) SENGAJA tetap bisa dipanggil anon: itu satu-
-- satunya jalur warta publik halaman depan.
--
-- Diuji kering di prod 4 Okt 2026 (transaksi yang selalu di-rollback):
-- matriks persona anon / authenticated belum disetujui / admin / bendahara
-- sebelum vs sesudah — lihat catatan rilis R4.
-- Rollback: supabase/rollback/0019_close_anon.down.sql

-- (a) Policy: public → authenticated --------------------------------------
ALTER POLICY "Admins decide approvals" ON public.account_approvals TO authenticated;
ALTER POLICY "Admins read all approvals" ON public.account_approvals TO authenticated;
ALTER POLICY "Own approval row is readable" ON public.account_approvals TO authenticated;
ALTER POLICY "Attendance readable by committee and own leaders" ON public.attendance TO authenticated;
ALTER POLICY "Attendance recordable by committee, PIC and leaders" ON public.attendance TO authenticated;
ALTER POLICY "Attendance updatable by committee, PIC and leaders" ON public.attendance TO authenticated;
ALTER POLICY "Audit logs readable by admins" ON public.audit_logs TO authenticated;
ALTER POLICY "Cross memberships readable by approved accounts" ON public.cross_memberships TO authenticated;
ALTER POLICY "Leaders can update their own group memberships" ON public.cross_memberships TO authenticated;
ALTER POLICY "Crosses readable by approved accounts" ON public.crosses TO authenticated;
ALTER POLICY "Committee can insert events" ON public.events TO authenticated;
ALTER POLICY "Committee can update events" ON public.events TO authenticated;
ALTER POLICY "Events readable by approved accounts" ON public.events TO authenticated;
ALTER POLICY "Finance readable by admin and treasurer" ON public.finance_transactions TO authenticated;
ALTER POLICY "Treasurer and admin can insert finance" ON public.finance_transactions TO authenticated;
ALTER POLICY "Treasurer and admin can update finance" ON public.finance_transactions TO authenticated;
ALTER POLICY "Committee can insert meetings" ON public.meeting_notes TO authenticated;
ALTER POLICY "Meetings readable by approved accounts" ON public.meeting_notes TO authenticated;
ALTER POLICY "Approved users can update own profile" ON public.profiles TO authenticated;
ALTER POLICY "Profiles readable by approved accounts" ON public.profiles TO authenticated;
ALTER POLICY "Skills readable by approved accounts" ON public.skills TO authenticated;
ALTER POLICY "Approved members confirm own steward slot" ON public.steward_assignments TO authenticated;
ALTER POLICY "Committee can delete steward assignments" ON public.steward_assignments TO authenticated;
ALTER POLICY "Committee can insert steward assignments" ON public.steward_assignments TO authenticated;
ALTER POLICY "Committee can update steward assignments" ON public.steward_assignments TO authenticated;
ALTER POLICY "Stewards readable by approved accounts" ON public.steward_assignments TO authenticated;

-- (b) EXECUTE: cabut dari PUBLIC + anon -----------------------------------
REVOKE EXECUTE ON FUNCTION public.add_cross_member(uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.am_i_approved() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.check_event_pic() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.claim_cross_leadership(uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.decide_account(uuid, text, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_member_whatsapp(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_my_app_role() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_admin_email(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_approved() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_committee() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_event_pic(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_ministry_email(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_pic_eligible(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_treasurer_email(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.leads_profile(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.list_pic_eligible() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.mark_attendance(uuid, uuid, boolean) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.my_profile_id() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.record_audit(text, text, text, jsonb, jsonb) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon;

-- (c) Fungsi baru: tidak otomatis terbuka untuk anon/PUBLIC ----------------
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;
