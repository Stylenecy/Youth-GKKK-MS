import { createClient } from "./server";

export async function getUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}

export async function getProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  // Explicit columns, never select("*"): migration 0006 revokes
  // profiles.whatsapp from clients, so "*" errors out at runtime and —
  // were it ever to succeed — would ship phone numbers to the caller.
  const { data } = await supabase
    .from("profiles")
    .select(
      "id,full_name,nickname,birth_date,hometown,university,cohort,status,notes,avatar_url,is_active,created_at,updated_at"
    )
    .eq("id", user.id)
    .single();
  return data;
}
