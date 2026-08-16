-- ============================================================
-- YGMS v2 — SEED DATA
-- Run AFTER schema.sql
-- Note: profiles are created here directly.
-- Auth users should be created via Supabase Auth UI or the app's signup flow.
-- All inserts use ON CONFLICT DO NOTHING — idempotent.
-- ============================================================

create extension if not exists "pgcrypto";

-- Profiles (matching seed.ts data)
-- NOTE: Do NOT insert into auth.users via SQL Editor — use Supabase Auth UI instead.
-- Profiles link to auth.users via the handle_new_user() trigger when users sign up.
insert into public.profiles (id, full_name, nickname, whatsapp, birth_date, hometown, university, cohort, status) values
  ('00000000-0000-0000-0000-000000000001', 'Angelina Gunawan', 'Angel', '08123456789', '2003-05-12', 'Yogyakarta', 'UKDW', '2022', 'active'),
  ('00000000-0000-0000-0000-000000000002', 'Benita Sari', 'Benita', '08123456780', '2003-08-20', 'Sleman', 'UGM', '2022', 'active'),
  ('00000000-0000-0000-0000-000000000003', 'Arion Permadi', 'Arion', '08123456781', '2002-11-15', 'Yogyakarta', 'Atma Jaya', '2021', 'active'),
  ('00000000-0000-0000-0000-000000000004', 'Dex Bennett', 'Dex', '08123456782', '2002-03-01', 'Yogyakarta', 'UKDW', '2021', 'active'),
  ('00000000-0000-0000-0000-000000000005', 'Marelta Christy', 'Marelta', '08123456783', '2003-07-09', 'Bantul', 'Sanata Dharma', '2022', 'active'),
  ('00000000-0000-0000-0000-000000000006', 'Valen Lie', 'Valen', '08123456784', '2003-12-25', 'Yogyakarta', 'UKDW', '2022', 'active'),
  ('00000000-0000-0000-0000-000000000007', 'Aeryn Adinata', 'Aeryn', '08123456785', '2004-01-30', 'Sleman', 'UGM', '2023', 'active'),
  ('00000000-0000-0000-0000-000000000008', 'Ella Pratiwi', 'Ella', '08123456786', '2002-06-18', 'Yogyakarta', 'UKDW', '2021', 'active'),
  ('00000000-0000-0000-0000-000000000009', 'Nathanael Pradipta', 'Nathan', '08123456787', '2003-04-05', 'Magelang', 'UGM', '2022', 'active'),
  ('00000000-0000-0000-0000-000000000010', 'Zeshaline Ivana', 'Cece', '08123456788', '2003-09-14', 'Yogyakarta', 'Atma Jaya', '2022', 'active')
on conflict (id) do nothing;

-- Monthly Themes
insert into public.monthly_themes (id, month, year, theme, description) values
  ('mt100000-0000-0000-0000-000000000001', 'Juli', 2026, 'The Way, The Truth, The Life', 'Menjelajahi kebenaran Kristus di tengah dunia yang membingungkan'),
  ('mt100000-0000-0000-0000-000000000002', 'Agustus', 2026, 'Redeemed to Love', 'Dipulihkan untuk mengasihi tanpa syarat')
on conflict (id) do nothing;

-- Events
insert into public.events (id, date, monthly_theme_id, weekly_theme, event_type, pic_id, speaker_name, description, status) values
  ('e1000000-0000-0000-0000-000000000001', '2026-07-05 17:00:00+07', 'mt100000-0000-0000-0000-000000000001', 'Akulah Jalan', 'worship', '00000000-0000-0000-0000-000000000001', 'Ko Martin', 'Ibadah sabtu pertama bulan Juli', 'published'),
  ('e1000000-0000-0000-0000-000000000002', '2026-07-12 17:00:00+07', 'mt100000-0000-0000-0000-000000000001', 'Akulah Kebenaran', 'worship', '00000000-0000-0000-0000-000000000002', 'Ko Martin', 'Ibadah sabtu kedua', 'draft'),
  ('e1000000-0000-0000-0000-000000000003', '2026-07-19 17:00:00+07', 'mt100000-0000-0000-0000-000000000001', 'Akulah Hidup', 'talkshow', '00000000-0000-0000-0000-000000000003', 'Tamu Undangan', 'Talkshow spesial', 'draft')
on conflict (id) do nothing;

-- Steward Assignments
insert into public.steward_assignments (id, event_id, profile_id, role, status, reason) values
  ('s1000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004', 'WL', 'confirmed', null),
  ('s1000000-0000-0000-0000-000000000002', 'e1000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000008', 'Singer', 'confirmed', null),
  ('s1000000-0000-0000-0000-000000000003', 'e1000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000010', 'Singer', 'confirmed', null),
  ('s1000000-0000-0000-0000-000000000004', 'e1000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000005', 'Keyboard', 'confirmed', null),
  ('s1000000-0000-0000-0000-000000000005', 'e1000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000009', 'Gitar', 'assigned', null),
  ('s1000000-0000-0000-0000-000000000006', 'e1000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', 'Multimedia', 'change_requested', 'Bentrok jadwal kuliah')
on conflict (id) do nothing;

-- Crosses
insert into public.crosses (id, name, leader_id, description, meeting_day, meeting_time) values
  ('c1000000-0000-0000-0000-000000000001', 'Vocatio', '00000000-0000-0000-0000-000000000004', 'Cross kecil pimpinan Ko Wangke', 'Jumat', '19:00'),
  ('c1000000-0000-0000-0000-000000000002', 'Shekinah', '00000000-0000-0000-0000-000000000001', 'Cross pemuda', 'Sabtu', '15:00'),
  ('c1000000-0000-0000-0000-000000000003', 'Ruach', '00000000-0000-0000-0000-000000000005', 'Cross pusat', 'Minggu', '12:00')
on conflict (id) do nothing;

-- Finance Transactions
insert into public.finance_transactions (id, event_id, amount, type, category, description, recorded_by) values
  ('f1000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000001', 250000, 'income', 'cash_offering', 'Persembahan ibadah 5 Juli', '00000000-0000-0000-0000-000000000001'),
  ('f1000000-0000-0000-0000-000000000002', 'e1000000-0000-0000-0000-000000000001',  75000, 'expense', 'food', 'Snack pelayan', '00000000-0000-0000-0000-000000000001'),
  ('f1000000-0000-0000-0000-000000000003', null,                          50000, 'expense', 'supplies', 'Beli kabel HDMI', '00000000-0000-0000-0000-000000000003'),
  ('f1000000-0000-0000-0000-000000000004', 'e1000000-0000-0000-0000-000000000002', 150000, 'income', 'qris', 'QRIS offering', '00000000-0000-0000-0000-000000000001')
on conflict (id) do nothing;

-- Meeting Notes
insert into public.meeting_notes (id, title, date, content, participants) values
  ('m1000000-0000-0000-0000-000000000001', 'Rapat Persiapan Ibadah Juli', '2026-06-28 18:00:00+07',
   '{"agenda":["Pembukaan","Pembahasan tema","Pembagian tugas"]}',
   '{00000000-0000-0000-0000-000000000001,00000000-0000-0000-0000-000000000002,00000000-0000-0000-0000-000000000003,00000000-0000-0000-0000-000000000004}'),
  ('m1000000-0000-0000-0000-000000000002', 'Evaluasi Bulan Juni', '2026-06-25 18:00:00+07',
   '{"agenda":["Evaluasi ibadah","Laporan keuangan","Rencana Juli"]}',
   '{00000000-0000-0000-0000-000000000001,00000000-0000-0000-0000-000000000002,00000000-0000-0000-0000-000000000003}')
on conflict (id) do nothing;