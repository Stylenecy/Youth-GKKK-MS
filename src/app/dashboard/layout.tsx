import { Sidebar } from "@/components/Sidebar";
import { MobileNav } from "@/components/MobileNav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-canvas text-ink selection:bg-accent selection:text-canvas">
      <Sidebar />

      <div className="relative flex min-w-0 flex-1 flex-col overflow-x-hidden">
        {/* Ambient atmospheric warm ember glow at the top */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-96 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(253,190,2,0.06),rgba(131,2,28,0.03)_50%,transparent_80%)]"
        />

        <MobileNav />

        {/* pb-24 clears the fixed bottom tab bar on phones. */}
        <main id="main" className="relative flex-1 pb-24 lg:pb-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
