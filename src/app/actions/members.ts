"use server";

import { revalidatePath } from "next/cache";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { friendlyDbError } from "@/lib/db-errors";
import { DEMO_NEEDS_LOGIN } from "@/lib/demo";

/**
 * Mark or unmark a member as Pengurus (migration 0025/0026) — only Pengurus
 * can be PIC. set_pengurus() checks the admin and writes the Audit line
 * itself, so this action only carries the call (no second audit row).
 */
export async function setPengurus(profileId: string, value: boolean) {
  if (typeof profileId !== "string" || profileId.trim() === "" || typeof value !== "boolean") {
    return { success: false, error: "Data anggota tidak valid." };
  }
  if (!isSupabaseConfigured()) {
    return { success: false, error: DEMO_NEEDS_LOGIN };
  }

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_pengurus", {
    p_profile_id: profileId,
    p_value: value,
  });
  if (error) return { success: false, error: friendlyDbError(error.message) };

  revalidatePath("/dashboard/members");
  revalidatePath(`/dashboard/members/${profileId}`);
  revalidatePath("/dashboard/gatherings");
  return { success: true };
}
