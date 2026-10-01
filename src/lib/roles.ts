import type { AppRole } from "./types";

/**
 * Satu sumber aturan peran untuk UI dan server action.
 *
 * Ini cermin RLS, bukan penggantinya: database tetap batas terakhir
 * (is_committee() di 0010, kas admin+bendahara, audit_logs admin-only).
 * Gunanya supaya tombol dan menu tidak menjanjikan hal yang nanti ditolak
 * diam-diam, dan supaya cek "komite" tidak disalin di empat halaman.
 *
 * `null` = mode demo (tanpa Supabase, tanpa sesi): semua terlihat supaya
 * pratinjau tetap utuh.
 */
export type RoleOrDemo = AppRole | null;

/** is_committee() di SQL: admin | treasurer | ministry. */
export const COMMITTEE_ROLES: readonly AppRole[] = ["admin", "treasurer", "ministry"];
/** Kas: tulis + baca penuh (RLS 0005 + Opsi A 28 Sep). */
export const FINANCE_ROLES: readonly AppRole[] = ["admin", "treasurer"];
/** audit_logs dapat dibaca admin saja (0010:126). */
export const AUDIT_ROLES: readonly AppRole[] = ["admin"];

const has = (allowed: readonly AppRole[], role: RoleOrDemo) =>
  role === null || allowed.includes(role);

/** Boleh mengatur ibadah + penatalayan. */
export const isCommittee = (role: RoleOrDemo) => has(COMMITTEE_ROLES, role);
export const canManageFinance = (role: RoleOrDemo) => has(FINANCE_ROLES, role);
export const canViewAudit = (role: RoleOrDemo) => has(AUDIT_ROLES, role);
/** Persetujuan akun baru — RLS account_approvals juga admin-only. */
export const canApproveAccounts = (role: RoleOrDemo) => has(AUDIT_ROLES, role);

export const ROLE_LABEL: Record<AppRole, string> = {
  admin: "Pengurus Inti (Admin)",
  treasurer: "Bendahara",
  leader: "Pemimpin Cross",
  ministry: "Tim Ibadah",
  member: "Anggota",
};
