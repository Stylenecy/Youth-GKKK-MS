import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    // The redirect response the browser actually receives must carry the
    // session cookies. Writing them only to `request.cookies` (as this used
    // to do) updates a copy that's discarded once this function returns —
    // the browser never gets a Set-Cookie header, so it lands on /dashboard
    // signed out and proxy.ts bounces it straight back to /login.
    const response = NextResponse.redirect(`${origin}${next}`);
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return response;
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
