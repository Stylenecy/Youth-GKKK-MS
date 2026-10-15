import { Sidebar } from "@/components/Sidebar";
import { MobileNav } from "@/components/MobileNav";
import { DashboardThemeShell, ThemeInitScript } from "@/components/DashboardTheme";
import { getMyAccountStatus, getMyRole } from "@/lib/data";
import { PendingApproval } from "@/components/PendingApproval";
import { ToastProvider } from "@/components/Toast";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // A session is not permission. Anyone can complete Google OAuth, so an
  // account only sees the dashboard once an admin has approved it. RLS
  // (migration 0010) enforces this at the database; this gate exists so an
  // unapproved visitor gets an explanation instead of rows of empty tables.
  const accountStatus = await getMyAccountStatus();
  if (accountStatus !== "approved") {
    return <PendingApproval status={accountStatus} />;
  }

  // Menu follows the role so nobody is sent to a page RLS keeps empty for
  // them. null = demo mode (no session): show everything for preview.
  const role = await getMyRole();

  // ThemeInitScript applies the stored theme before first paint;
  // DashboardThemeShell re-applies it on client-side navigation into
  // the dashboard (the script only runs on full page loads).
  return (
    <>
      <ThemeInitScript />
      <DashboardThemeShell>
      {/* Geist Mono (brand: numbers, dates, tags) is loaded site-wide by the
          root layout. Modals portal into [data-modal-root] below so they
          inherit the face and theme. */}
      <div className="dash-type">
      <ToastProvider>
      <div className="flex min-h-screen bg-canvas text-ink selection:bg-accent selection:text-canvas">
      <Sidebar role={role} />

      <div className="relative flex min-w-0 flex-1 flex-col overflow-x-hidden">
        <MobileNav role={role} />

        {/* pb-24 clears the fixed bottom tab bar on phones. */}
        <main id="main" className="relative flex-1 pb-24 lg:pb-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
      </ToastProvider>
      <div data-modal-root />
      </div>
      </DashboardThemeShell>
    </>
  );
}
