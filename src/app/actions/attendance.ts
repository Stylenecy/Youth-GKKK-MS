"use server";

import { revalidatePath } from "next/cache";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { recordAudit } from "@/lib/audit";

/**
 * Record one person's attendance verdict for a gathering.
 *
 * The real permission check lives in mark_attendance() (migration 0012,
 * SECURITY DEFINER): committee, the event's PIC, or a leader of the
 * person's own Cross. A forged call from DevTools gets
 * 'not_allowed_to_record', not a row — this action only forwards validated
 * ids and writes the audit line after the database accepts the write.
 */
export async function markAttendance(
  eventId: string,
  profileId: string,
  present: boolean
) {
  if (
    typeof eventId !== "string" || eventId.trim() === "" ||
    typeof profileId !== "string" || profileId.trim() === "" ||
    typeof present !== "boolean"
  ) {
    return { success: false, error: "Data kehadiran tidak valid." };
  }

  if (isSupabaseConfigured()) {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    const { error } = await supabase.rpc("mark_attendance", {
      p_event_id: eventId,
      p_profile_id: profileId,
      p_present: present,
    });
    if (error) return { success: false, error: error.message };

    await recordAudit("Mencatat kehadiran", "attendance", eventId, {
      after: { profileId, present },
    });
  }

  revalidatePath(`/dashboard/gatherings/${eventId}`);
  return { success: true };
}
