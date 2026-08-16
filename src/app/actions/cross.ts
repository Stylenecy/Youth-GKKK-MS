"use server";

import { revalidatePath } from "next/cache";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { validateMemberName } from "@/lib/validation";

/**
 * Postgres error messages from the RPCs in migration 0004, translated for
 * a leader who has never seen a stack trace. Anything not in this map
 * falls back to the raw message — still more useful than a generic
 * "something went wrong" while this list is incomplete.
 */
const ERROR_MESSAGES: Record<string, string> = {
  not_authenticated: "Kamu belum masuk. Coba masuk ulang.",
  invalid_code: "Kode akses salah. Cek lagi ke pengurus.",
  cross_not_found: "Kelompok ini tidak ditemukan — mungkin sudah dihapus.",
  name_required: "Nama wajib diisi.",
  name_too_long: "Nama terlalu panjang (maksimal 80 karakter).",
  not_a_leader_of_this_group:
    "Kamu bukan pemimpin kelompok ini, jadi tidak bisa menambah anggota di sini.",
};

function friendlyError(message: string | undefined): string {
  if (!message) return "Terjadi kesalahan. Coba lagi.";
  return ERROR_MESSAGES[message] ?? message;
}

/**
 * Self-service leadership claim.
 *
 * The real authorization — the shared code check, the idempotent insert —
 * happens inside claim_cross_leadership() in Postgres (migration 0004),
 * not here. This action's job is just: get the caller's session, call the
 * function, translate whatever comes back.
 */
export async function claimCrossLeadership(crossId: string, code: string) {
  if (!isSupabaseConfigured()) {
    return { success: false, error: "Supabase belum tersambung." };
  }
  if (!code.trim()) {
    return { success: false, error: "Kode akses wajib diisi." };
  }

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  const { error } = await supabase.rpc("claim_cross_leadership", {
    p_cross_id: crossId,
    p_code: code,
  });

  if (error) {
    return { success: false, error: friendlyError(error.message) };
  }

  revalidatePath("/dashboard/cross");
  revalidatePath("/dashboard/cross/mine");
  return { success: true };
}

/**
 * Quick-add a Cross member: name only, everything else fills in later.
 *
 * Ownership ("is this person actually a leader of this group, or an
 * admin") is checked inside add_cross_member() in Postgres, in the same
 * transaction as the insert — see migration 0004. The check here is only
 * a fast client-side rejection for an empty/oversized name, so a leader
 * gets that feedback before a round trip, not the security boundary.
 */
export async function addCrossMember(crossId: string, name: string) {
  if (!isSupabaseConfigured()) {
    return { success: false, error: "Supabase belum tersambung." };
  }

  const validated = validateMemberName(name);
  if (!validated.ok) {
    return { success: false, error: validated.error };
  }

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  const { error } = await supabase.rpc("add_cross_member", {
    p_cross_id: crossId,
    p_name: validated.value,
  });

  if (error) {
    return { success: false, error: friendlyError(error.message) };
  }

  revalidatePath("/dashboard/cross");
  revalidatePath(`/dashboard/cross/${crossId}`);
  revalidatePath("/dashboard/cross/mine");
  revalidatePath("/dashboard/members");
  return { success: true };
}
