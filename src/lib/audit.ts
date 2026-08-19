import { isSupabaseConfigured } from "./supabase/env";

/**
 * Append one line to the audit trail.
 *
 * Deliberately fire-and-forget in its failure behaviour: if the audit write
 * fails, the action it was recording has already succeeded, and throwing here
 * would turn "we forgot to write a log line" into "your transaction was
 * rejected". Failures are logged to the server console instead.
 *
 * The actor is never passed from here — record_audit() (migration 0008) reads
 * auth.uid() inside SQL, so a caller cannot attribute an action to someone
 * else.
 */
export async function recordAudit(
  action: string,
  entityType: string,
  entityId: string,
  values?: { before?: unknown; after?: unknown }
): Promise<void> {
  if (!isSupabaseConfigured()) return;

  try {
    const { createClient } = await import("./supabase/server");
    const supabase = await createClient();

    const { error } = await supabase.rpc("record_audit", {
      p_action: action,
      p_entity_type: entityType,
      p_entity_id: entityId,
      p_old_value: values?.before ?? null,
      p_new_value: values?.after ?? null,
    });

    if (error) console.error("[audit] gagal mencatat:", action, error.message);
  } catch (err) {
    console.error("[audit] gagal mencatat:", action, err);
  }
}
