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

      <div className="flex min-w-0 flex-1 flex-col">
        <MobileNav />

        {/* pb-24 clears the fixed bottom tab bar on phones. */}
        <main id="main" className="flex-1 pb-24 lg:pb-0">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
