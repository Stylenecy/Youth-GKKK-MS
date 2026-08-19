"use server";

import { revalidatePath } from "next/cache";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { recordAudit } from "@/lib/audit";

const ERROR_MESSAGES: Record<string, string> = {
  not_an_admin: "Hanya admin yang bisa menyetujui atau menolak akun.",
  invalid_status: "Status tidak dikenal.",
  cannot_revoke_self: "Kamu tidak bisa mencabut aksesmu sendiri.",
  account_not_found: "Akun itu tidak ditemukan — mungkin sudah dihapus.",
};

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
    return { success: false, error: "Supabase belum tersambung." };
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
      error: ERROR_MESSAGES[error.message] ?? error.message,
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
