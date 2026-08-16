-- ============================================================
-- Migration 0002 — soft delete for finance transactions
--
-- Run this in the Supabase SQL Editor AFTER schema.sql.
-- Idempotent: safe to run more than once.
--
-- Why: the dashboard needs a delete button for mis-entered rows, but a
-- cash book that can silently lose rows cannot be audited. So "delete"
-- marks deleted_at instead of removing the row. Deleted rows stop
-- counting toward any balance and can be restored.
-- ============================================================

alter table public.finance_transactions
  add column if not exists deleted_at timestamptz;

-- Every balance query filters on this, so index it.
create index if not exists idx_finance_not_deleted
  on public.finance_transactions (deleted_at)
  where deleted_at is null;

comment on column public.finance_transactions.deleted_at is
  'Soft delete marker. NULL = live row. Never hard-delete finance rows.';
