import { Sidebar } from "@/components/Sidebar";
import { MobileNav } from "@/components/MobileNav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-canvas">
      <Sidebar />

      <div className="relative flex min-w-0 flex-1 flex-col">
        {/* A single low ember wash at the top of the working area. Without
            it the dark ground is a flat field and the whole app reads as
            switched off rather than lit. Decorative only, and it sits
            behind everything. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_70%_100%_at_50%_0%,rgba(253,190,2,0.055),transparent_72%)]"
        />

        <MobileNav />

        {/* pb-24 clears the fixed bottom tab bar on phones. */}
        <main id="main" className="relative flex-1 pb-24 lg:pb-0">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
