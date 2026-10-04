"use client";

import { useEffect, useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import {
  DASHBOARD_THEME_EVENT,
  DASHBOARD_THEME_KEY,
  parseDashboardTheme,
  type DashboardTheme,
} from "@/lib/theme";

/** Choice made this session when storage is blocked (private mode). */
let sessionTheme: DashboardTheme = "dark";

function readStoredTheme(): DashboardTheme {
  try {
    return parseDashboardTheme(localStorage.getItem(DASHBOARD_THEME_KEY));
  } catch {
    // Private mode / blocked storage: whatever was picked this session.
    return sessionTheme;
  }
}

/** Re-read the theme whenever this tab or another one changes it. */
function subscribeTheme(onChange: () => void) {
  window.addEventListener(DASHBOARD_THEME_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(DASHBOARD_THEME_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function applyTheme(theme: DashboardTheme) {
  document.documentElement.setAttribute("data-theme", theme);
  window.dispatchEvent(new CustomEvent(DASHBOARD_THEME_EVENT, { detail: theme }));
}

/**
 * Keeps <html data-theme> in sync with the stored choice.
 *
 * Needed because the pre-paint ThemeInitScript only runs on a full page
 * load — client-side navigation (e.g. landing → dashboard) never
 * re-executes it, so the shell re-applies the choice on every mount.
 */
export function DashboardThemeShell({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const stored = readStoredTheme();
    document.documentElement.setAttribute("data-theme", stored);
    const onTheme = (e: Event) =>
      document.documentElement.setAttribute(
        "data-theme",
        parseDashboardTheme((e as CustomEvent).detail)
      );
    window.addEventListener(DASHBOARD_THEME_EVENT, onTheme);
    return () => window.removeEventListener(DASHBOARD_THEME_EVENT, onTheme);
  }, []);

  return <>{children}</>;
}

/**
 * Blocking pre-paint script: applies the stored theme before the browser
 * paints, so light-mode committee members never see a dark flash.
 * Runs only on full loads; DashboardThemeShell covers client navigation.
 */
export function ThemeInitScript() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `try{var t=localStorage.getItem("${DASHBOARD_THEME_KEY}");if(t==="light"){document.documentElement.setAttribute("data-theme","light");}}catch(e){}`,
      }}
    />
  );
}

/** Light/dark switch for the dashboard. Rendered in Sidebar + MobileNav. */
export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  // The server always renders the dark default; the client reads storage.
  // useSyncExternalStore instead of setState-in-effect (react-hooks rule).
  const theme = useSyncExternalStore<DashboardTheme>(subscribeTheme, readStoredTheme, () => "dark");

  const next = theme === "dark" ? "light" : "dark";

  function toggle() {
    sessionTheme = next;
    try {
      localStorage.setItem(DASHBOARD_THEME_KEY, next);
    } catch {
      // Storage blocked: still flip for this session.
    }
    applyTheme(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={theme === "light"}
      aria-label={theme === "dark" ? "Aktifkan mode terang" : "Aktifkan mode gelap"}
      title={theme === "dark" ? "Mode terang" : "Mode gelap"}
      className={
        compact
          ? "flex h-11 w-11 items-center justify-center rounded-full text-ink-faint transition-colors hover:bg-surface hover:text-accent"
          : "lp-meta flex min-h-[44px] w-full items-center gap-2 rounded-lg px-3 text-ink-muted transition-colors hover:bg-surface hover:text-accent"
      }
    >
      {theme === "dark" ? (
        <Sun className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
      ) : (
        <Moon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
      )}
      {!compact && (
        <span>{theme === "dark" ? "Mode Terang" : "Mode Gelap"}</span>
      )}
    </button>
  );
}
