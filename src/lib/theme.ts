/**
 * Dashboard theme (dark Nocturne vs light Warta paper).
 *
 * The landing page is always dark — it pins data-theme="dark" on its own
 * root — so this choice only ever affects the committee-only dashboard.
 * Persisted per browser; the default is dark, matching the live site
 * everyone already knows.
 */
export type DashboardTheme = "dark" | "light";

export const DASHBOARD_THEME_KEY = "ygms-dashboard-theme";
export const DASHBOARD_THEME_EVENT = "ygms:dashboard-theme";

/** Unknown, missing, or corrupted values fall back to dark. Never throws. */
export function parseDashboardTheme(raw: unknown): DashboardTheme {
  return raw === "light" ? "light" : "dark";
}
