"use server";

import { revalidatePath } from "next/cache";
import { eventSchema } from "@/lib/schemas";
import { wibToISO } from "@/lib/datetime";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { isStewardRole } from "@/lib/validation";
import { friendlyDbError } from "@/lib/db-errors";
import { recordAudit } from "@/lib/audit";
import { COMMITTEE_ROLES } from "@/lib/roles";
import { requireRole, NOT_COMMITTEE, NOTHING_CHANGED } from "@/lib/role-guard";

const requireCommittee = () => requireRole(COMMITTEE_ROLES, NOT_COMMITTEE);

export async function createEvent(formData: FormData) {
  const rawData = {
    date: formData.get("date") as string,
    time: (formData.get("time") as string) || "",
    weeklyTheme: formData.get("weeklyTheme") as string,
    eventType: formData.get("eventType") as string,
    picId: formData.get("picId") as string,
    speakerName: formData.get("speakerName") as string,
    description: formData.get("description") as string,
  };

  const validated = eventSchema.safeParse(rawData);

  if (!validated.success) {
    return { success: false, errors: validated.error.flatten().fieldErrors };
  }

  if (isSupabaseConfigured()) {
    const auth = await requireCommittee();
    if (!auth.ok) return { success: false, errors: { form: [auth.error] } };
    const { supabase } = auth;

    // PIC harus pengurus (keputusan Dex, 19 Sep 2026). Trigger 0013
    // menegakkan ini di database; cek di sini dulu supaya penolakannya
    // menempel di field yang salah dengan bahasa manusia, bukan crash.
    const { data: picEligible } = await supabase.rpc("is_pic_eligible", {
      p_profile_id: validated.data.picId,
    });
    if (picEligible !== true) {
      return {
        success: false,
        errors: {
          picId: ["PIC harus pengurus — pengurus inti atau pemimpin Cross yang masih aktif."],
        },
      };
    }

    const { data: created, error } = await supabase.from("events").insert({
      date: wibToISO(validated.data.date, validated.data.time),
      weekly_theme: validated.data.weeklyTheme,
      event_type: validated.data.eventType,
      pic_id: validated.data.picId,
      speaker_name: validated.data.speakerName,
      description: validated.data.description || null,
      status: "draft",
    }).select("id").single();

    if (error) {
      return { success: false, errors: { form: [friendlyDbError(error.message)] } };
    }

    await recordAudit("Menambah ibadah", "event", created?.id ?? "?", {
      after: { weeklyTheme: validated.data.weeklyTheme, date: validated.data.date },
    });
  }

  revalidatePath("/dashboard/gatherings");
  return { success: true };
}

export async function updateEvent(id: string, formData: FormData) {
  const rawData = {
    date: formData.get("date") as string,
    time: (formData.get("time") as string) || "",
    weeklyTheme: formData.get("weeklyTheme") as string,
    eventType: formData.get("eventType") as string,
    picId: formData.get("picId") as string,
    speakerName: formData.get("speakerName") as string,
    description: formData.get("description") as string,
  };

  const validated = eventSchema.safeParse(rawData);

  if (!validated.success) {
    return { success: false, errors: validated.error.flatten().fieldErrors };
  }

  if (isSupabaseConfigured()) {
    const auth = await requireCommittee();
    if (!auth.ok) return { success: false, errors: { form: [auth.error] } };
    const { supabase } = auth;

    // Sama seperti createEvent di atas: PIC harus pengurus.
    const { data: picEligible } = await supabase.rpc("is_pic_eligible", {
      p_profile_id: validated.data.picId,
    });
    if (picEligible !== true) {
      return {
        success: false,
        errors: {
          picId: ["PIC harus pengurus — pengurus inti atau pemimpin Cross yang masih aktif."],
        },
      };
    }

    const { data: changed, error } = await supabase
      .from("events")
      .update({
        date: wibToISO(validated.data.date, validated.data.time),
        weekly_theme: validated.data.weeklyTheme,
        event_type: validated.data.eventType,
        pic_id: validated.data.picId,
        speaker_name: validated.data.speakerName,
        description: validated.data.description || null,
      })
      .eq("id", id)
      .select("id");

    if (error) {
      return { success: false, errors: { form: [friendlyDbError(error.message)] } };
    }
    if (!changed?.length) {
      return { success: false, errors: { form: [NOTHING_CHANGED] } };
    }

    await recordAudit("Mengubah ibadah", "event", id, {
      after: { weeklyTheme: validated.data.weeklyTheme, date: validated.data.date },
    });
  }

  revalidatePath("/dashboard/gatherings");
  revalidatePath(`/dashboard/gatherings/${id}`);
  revalidatePath("/");
  return { success: true };
}

/**
 * "Delete" an event.
 *
 * Archiving, not removing. The site promises the next kepengurusan inherits
 * a memory rather than an empty folder, so nothing here is ever destroyed —
 * archived events simply drop out of every upcoming/agenda query.
 */
export async function archiveEvent(id: string) {
  if (isSupabaseConfigured()) {
    const auth = await requireCommittee();
    if (!auth.ok) return { success: false, error: auth.error };

    const { data: changed, error } = await auth.supabase
      .from("events")
      .update({ status: "archived", archived_at: new Date().toISOString() })
      .eq("id", id)
      .select("id");

    if (error) return { success: false, error: friendlyDbError(error.message) };
    if (!changed?.length) return { success: false, error: NOTHING_CHANGED };

    await recordAudit("Mengarsipkan ibadah", "event", id);
  }

  revalidatePath("/dashboard/gatherings");
  revalidatePath("/");
  return { success: true };
}

/** Undo an archive — the mirror of archiveEvent, so the action is reversible. */
export async function restoreEvent(id: string) {
  if (isSupabaseConfigured()) {
    const auth = await requireCommittee();
    if (!auth.ok) return { success: false, error: auth.error };

    const { data: changed, error } = await auth.supabase
      .from("events")
      .update({ status: "draft", archived_at: null })
      .eq("id", id)
      .select("id");

    if (error) return { success: false, error: friendlyDbError(error.message) };
    if (!changed?.length) return { success: false, error: NOTHING_CHANGED };

    await recordAudit("Memulihkan ibadah", "event", id);
  }

  revalidatePath("/dashboard/gatherings");
  revalidatePath(`/dashboard/gatherings/${id}`);
  revalidatePath("/");
  return { success: true };
}

export async function assignSteward(eventId: string, profileId: string, role: string) {
  if (
    typeof eventId !== "string" || eventId.trim() === "" ||
    typeof profileId !== "string" || profileId.trim() === "" ||
    !isStewardRole(role)
  ) {
    return { success: false, error: "Data penatalayan tidak valid." };
  }

  if (isSupabaseConfigured()) {
    const auth = await requireCommittee();
    if (!auth.ok) return { success: false, error: auth.error };
    const { data: created, error } = await auth.supabase.from("steward_assignments").insert({
      event_id: eventId,
      profile_id: profileId,
      role,
      status: "assigned",
    }).select("id").single();
    if (error) return { success: false, error: friendlyDbError(error.message) };

    await recordAudit("Menugaskan penatalayan", "steward_assignment", created?.id ?? "?", {
      after: { eventId, role },
    });
    revalidatePath(`/dashboard/gatherings/${eventId}`);
    revalidatePath("/dashboard/penatalayan");
    return { success: true, id: created?.id ?? null };
  }
  revalidatePath(`/dashboard/gatherings/${eventId}`);
  revalidatePath("/dashboard/penatalayan");
  return { success: true, id: null };
}

/**
 * Undo a just-made assignment (toast "Batalkan").
 *
 * Hard delete, bukan soft: barisnya berumur detik dan salah input — tidak
 * ada sejarah yang layak dipertahankan. Butuh migrasi 0014 (committee
 * boleh DELETE steward_assignments). RLS yang menolak DELETE tidak melempar
 * error — cuma mengenai 0 baris — jadi jumlah baris dicek eksplisit supaya
 * "Batalkan" tidak mengaku berhasil.
 */
export async function removeStewardAssignment(id: string, eventId: string) {
  if (typeof id !== "string" || id.trim() === "") {
    return { success: false, error: "Data penugasan tidak valid." };
  }

  if (isSupabaseConfigured()) {
    const auth = await requireCommittee();
    if (!auth.ok) return { success: false, error: auth.error };
    const { data: removed, error } = await auth.supabase
      .from("steward_assignments")
      .delete()
      .eq("id", id)
      .select("id");
    if (error) return { success: false, error: friendlyDbError(error.message) };
    // 0 rows = RLS refused (no committee DELETE policy, i.e. 0014 missing)
    // or the row is already gone. Either way nothing changed — say so.
    if (!removed?.length) return { success: false, error: NOTHING_CHANGED };

    await recordAudit("Membatalkan penugasan", "steward_assignment", id, {
      after: { eventId },
    });
  }
  revalidatePath(`/dashboard/gatherings/${eventId}`);
  revalidatePath("/dashboard/penatalayan");
  return { success: true };
}
