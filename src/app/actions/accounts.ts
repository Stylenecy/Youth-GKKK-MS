"use server";

import { revalidatePath } from "next/cache";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { friendlyDbError } from "@/lib/db-errors";
import { recordAudit } from "@/lib/audit";
import { DEMO_NEEDS_LOGIN } from "@/lib/demo";

/**
 * Approve or reject a login request.
 *
 * The admin check lives in decide_account() in Postgres (migration 0011), not
 * here — same pattern as the Cross leadership RPCs. This action only carries
 * the call and translates the error.
 */
export async function decideAccount(
  userId: string,
  status: "approved" | "rejected"
) {
  if (!isSupabaseConfigured()) {
    return { success: false, error: DEMO_NEEDS_LOGIN };
  }

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  const { error } = await supabase.rpc("decide_account", {
    p_user_id: userId,
    p_status: status,
    p_note: null,
  });

  if (error) {
    return {
      success: false,
      // One dictionary for every RPC error code: lib/db-errors.ts.
      error: friendlyDbError(error.message),
    };
  }

  await recordAudit(
    status === "approved" ? "Menyetujui akses akun" : "Menolak akses akun",
    "account",
    userId,
    { after: { status } }
  );

  revalidatePath("/dashboard/settings");
  return { success: true };
}

/**
 * Tie a login to the member it belongs to (S19, migration 0023) — for the
 * accounts the automatic exact-email match could not place ("perlu dicek").
 * link_account_to_profile() checks the admin, refuses a member already tied
 * to another login, and stores the login's email on the member so the next
 * sign-in links by itself.
 */
export async function linkAccountToProfile(userId: string, profileId: string) {
  if (
    typeof userId !== "string" || userId.trim() === "" ||
    typeof profileId !== "string" || profileId.trim() === ""
  ) {
    return { success: false, error: "Pilih anggota yang akan ditautkan." };
  }
  if (!isSupabaseConfigured()) {
    return { success: false, error: DEMO_NEEDS_LOGIN };
  }

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { error } = await supabase.rpc("link_account_to_profile", {
    p_user_id: userId,
    p_profile_id: profileId,
  });
  if (error) return { success: false, error: friendlyDbError(error.message) };

  await recordAudit("Menautkan akun ke data anggota", "account", userId, {
    after: { profileId },
  });
  revalidatePath("/dashboard/settings");
  return { success: true };
}
