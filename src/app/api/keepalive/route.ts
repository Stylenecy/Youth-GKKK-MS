import { isSupabaseConfigured } from "@/lib/supabase/env";

/**
 * Daily keep-alive for the free Supabase project (vercel.json `crons`).
 *
 * A free project is paused after about a week without traffic; on 16 Oct
 * 2026 it was found paused and the public bulletin read "Belum bisa
 * dimuat". The landing page only touches the database when somebody visits
 * it, so a quiet week is enough to switch the dashboard off.
 *
 * It makes the same read-only call any guest makes (public_bulletin(): no
 * names, see migration 0017/0018), so it exposes nothing new. When the
 * deployment has a CRON_SECRET, Vercel sends it and anyone else is refused.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  if (!isSupabaseConfigured()) {
    return Response.json({ ok: true, mode: "demo" });
  }

  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
  const { error } = await supabase.rpc("public_bulletin");
  if (error) {
    console.error("[keepalive]", error.message);
    return Response.json({ ok: false }, { status: 503 });
  }
  return Response.json({ ok: true, at: new Date().toISOString() });
}
