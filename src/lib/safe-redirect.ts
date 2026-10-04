/**
 * Where to send someone after sign-in, given the untrusted `next` parameter.
 *
 * The callback used to build `${origin}${next}`. With next = "@evil.com" that
 * string becomes "https://our-host@evil.com" — evil.com with our host as a
 * username — and next = ".evil.com" becomes "https://our-host.evil.com".
 * Both are open redirects straight after a successful login.
 *
 * Only same-site paths are accepted; anything else falls back to the
 * dashboard. The result is always resolved against `origin` and checked to
 * still be on it, so no string trick can leave the site.
 */
export function safeRedirectUrl(next: string | null, origin: string, fallback = "/dashboard"): string {
  const home = new URL(fallback, origin).toString();
  if (!next) return home;
  // A path, not a scheme-relative URL ("//host") or a backslash variant
  // browsers normalise to one ("/\host").
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return home;
  try {
    const url = new URL(next, origin);
    return url.origin === new URL(origin).origin ? url.toString() : home;
  } catch {
    return home;
  }
}
