"use server";

import { revalidatePath } from "next/cache";
import { eventSchema } from "@/lib/schemas";
import { wibToISO } from "@/lib/datetime";
import { isSupabaseConfigured } from "@/lib/supabase/env";

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
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    const { error } = await supabase.from("events").insert({
      date: wibToISO(validated.data.date, validated.data.time),
      weekly_theme: validated.data.weeklyTheme,
      event_type: validated.data.eventType,
      pic_id: validated.data.picId,
      speaker_name: validated.data.speakerName,
      description: validated.data.description || null,
      status: "draft",
    });

    if (error) {
      return { success: false, errors: { form: [error.message] } };
    }
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
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    const { error } = await supabase
      .from("events")
      .update({
        date: wibToISO(validated.data.date, validated.data.time),
        weekly_theme: validated.data.weeklyTheme,
        event_type: validated.data.eventType,
        pic_id: validated.data.picId,
        speaker_name: validated.data.speakerName,
        description: validated.data.description || null,
      })
      .eq("id", id);

    if (error) {
      return { success: false, errors: { form: [error.message] } };
    }
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
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    const { error } = await supabase
      .from("events")
      .update({ status: "archived", archived_at: new Date().toISOString() })
      .eq("id", id);

    if (error) return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/gatherings");
  revalidatePath("/");
  return { success: true };
}

/** Undo an archive — the mirror of archiveEvent, so the action is reversible. */
export async function restoreEvent(id: string) {
  if (isSupabaseConfigured()) {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    const { error } = await supabase
      .from("events")
      .update({ status: "draft", archived_at: null })
      .eq("id", id);

    if (error) return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/gatherings");
  revalidatePath(`/dashboard/gatherings/${id}`);
  revalidatePath("/");
  return { success: true };
}

export async function updateEventStatus(id: string, status: string) {
  if (isSupabaseConfigured()) {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    await supabase.from("events").update({ status }).eq("id", id);
  }
  revalidatePath("/dashboard/gatherings");
  return { success: true };
}

export async function assignSteward(eventId: string, profileId: string, role: string) {
  if (isSupabaseConfigured()) {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { error } = await supabase.from("steward_assignments").insert({
      event_id: eventId,
      profile_id: profileId,
      role,
      status: "assigned",
    });
    if (error) return { success: false, error: error.message };
  }
  revalidatePath(`/dashboard/gatherings/${eventId}`);
  return { success: true };
}
