"use server";

import { revalidatePath } from "next/cache";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { validateMemberName } from "@/lib/validation";
import { friendlyDbError } from "@/lib/db-errors";
import { recordAudit } from "@/lib/audit";

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
    return { success: false, error: friendlyDbError(error.message) };
  }

  await recordAudit("Mengklaim kepemimpinan Cross", "cross", crossId);

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
    return { success: false, error: friendlyDbError(error.message) };
  }

  // Name is the point of the action, so it belongs in the log — this trail is
  // visible only to signed-in pengurus, same audience that can already see the
  // member directory.
  await recordAudit("Menambah anggota Cross", "cross", crossId, {
    after: { name: validated.value },
  });

  revalidatePath("/dashboard/cross");
  revalidatePath(`/dashboard/cross/${crossId}`);
  revalidatePath("/dashboard/cross/mine");
  revalidatePath("/dashboard/members");
  return { success: true };
}
