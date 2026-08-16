import { Link, useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Home,
  Calendar,
  Users,
  Cross,
  Wallet,
  FileText,
  ClipboardList,
  Settings,
  Menu,
  LogOut,
  Globe,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navSections = [
  {
    label: "Saturday",
    items: [
      { to: "/dashboard", icon: Home, labelKey: "nav.dashboard" },
      { to: "/gatherings", icon: Calendar, labelKey: "nav.gatherings" },
    ],
  },
  {
    label: "People",
    items: [
      { to: "/members", icon: Users, labelKey: "nav.members" },
      { to: "/cross", icon: Cross, labelKey: "nav.cross" },
    ],
  },
  {
    label: "Admin",
    items: [
      { to: "/finance", icon: Wallet, labelKey: "nav.finance" },
      { to: "/meetings", icon: FileText, labelKey: "nav.meetings" },
      { to: "/audit", icon: ClipboardList, labelKey: "nav.audit" },
      { to: "/settings", icon: Settings, labelKey: "nav.settings" },
    ],
  },
];

const bottomNavItems = [
  { to: "/dashboard", icon: Home, labelKey: "nav.dashboard" },
  { to: "/gatherings", icon: Calendar, labelKey: "nav.gatherings" },
  { to: "/members", icon: Users, labelKey: "nav.members" },
  { to: "/finance", icon: Wallet, labelKey: "nav.finance" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === "id" ? "en" : "id");
  };

  const isActive = (path: string) => {
    if (path === "/dashboard") return location.pathname === "/" || location.pathname === "/dashboard";
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white">
      {/* Aurora glow at top */}
      <div className="fixed inset-x-0 top-0 h-[400px] aurora-glow pointer-events-none z-0" />

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-full w-[240px] flex-col border-r border-white/[0.06] bg-[#0A0A0F]/80 backdrop-blur-xl z-40">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-5">
          <div className="w-8 h-8 rounded-lg gradient-aurora flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight">GKKK Youth</h1>
            <p className="text-[10px] text-[#6B7280] -mt-0.5">Space Youth</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-2 space-y-5">
          {navSections.map((section) => (
            <div key={section.label}>
              <p className="px-3 text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider mb-1.5">
                {section.label}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-200",
                      isActive(item.to)
                        ? "bg-white/[0.06] text-white font-medium"
                        : "text-[#C0C0C0] hover:bg-white/[0.04] hover:text-white"
                    )}
                  >
                    <item.icon
                      className={cn(
                        "w-[18px] h-[18px]",
                        isActive(item.to) && "text-[#A78BFA]"
                      )}
                    />
                    {t(item.labelKey)}
                    {isActive(item.to) && (
                      <div className="ml-auto w-1 h-1 rounded-full gradient-aurora" />
                    )}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* User */}
        <div className="border-t border-white/[0.06] p-3">
          <div className="flex items-center gap-2.5 px-2 py-2">
            <div className="w-8 h-8 rounded-full gradient-nebula flex items-center justify-center text-xs font-bold">
              {user?.fullName?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {user?.fullName || "Guest"}
              </p>
              <p className="text-[10px] text-[#6B7280] capitalize">
                {user?.role || "member"}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-[#6B7280] hover:text-white"
              onClick={logout}
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Top Bar */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 glass-strong border-b border-white/[0.06]">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md gradient-aurora flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-bold">GKKK Youth</span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-[#C0C0C0]"
              onClick={toggleLanguage}
            >
              <Globe className="w-[18px] h-[18px]" />
            </Button>
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-[#C0C0C0]"
                >
                  <Menu className="w-[18px] h-[18px]" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-[280px] bg-[#0A0A0F] border-l border-white/[0.06] p-0"
              >
                <div className="flex flex-col h-full">
                  <div className="p-4 border-b border-white/[0.06]">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full gradient-nebula flex items-center justify-center text-sm font-bold">
                        {user?.fullName?.charAt(0)?.toUpperCase() || "U"}
                      </div>
                      <div>
                        <p className="font-medium">
                          {user?.fullName || "Guest"}
                        </p>
                        <p className="text-xs text-[#6B7280] capitalize">
                          {user?.role || "member"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <nav className="flex-1 overflow-y-auto p-3 space-y-1">
                    {navSections.flatMap((s) => s.items).map((item) => (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={() => setMobileMenuOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all",
                          isActive(item.to)
                            ? "bg-white/[0.06] text-white font-medium"
                            : "text-[#C0C0C0] hover:bg-white/[0.04]"
                        )}
                      >
                        <item.icon className="w-[18px] h-[18px]" />
                        {t(item.labelKey)}
                        <ChevronRight className="w-4 h-4 ml-auto text-[#6B7280]" />
                      </Link>
                    ))}
                  </nav>
                  <div className="p-3 border-t border-white/[0.06]">
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-[#EF4444] hover:text-[#EF4444] hover:bg-red-500/10"
                      onClick={() => {
                        logout();
                        setMobileMenuOpen(false);
                      }}
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      {t("nav.logout")}
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="lg:ml-[240px] min-h-screen pt-[60px] lg:pt-0 pb-[80px] lg:pb-0 relative z-10">
        {children}
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 glass-strong border-t border-white/[0.06] rounded-t-3xl">
        <div className="flex items-center justify-around px-2 py-2">
          {bottomNavItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all min-w-[60px]",
                isActive(item.to)
                  ? "text-white"
                  : "text-[#6B7280]"
              )}
            >
              <item.icon
                className={cn(
                  "w-5 h-5",
                  isActive(item.to) && "text-[#A78BFA]"
                )}
              />
              <span className="text-[10px] font-medium">
                {t(item.labelKey)}
              </span>
              {isActive(item.to) && (
                <div className="absolute bottom-1 w-6 h-0.5 rounded-full gradient-aurora" />
              )}
            </Link>
          ))}
          <Link
            to="/settings"
            className={cn(
              "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all min-w-[60px]",
              isActive("/settings") ? "text-white" : "text-[#6B7280]"
            )}
          >
            <Settings className="w-5 h-5" />
            <span className="text-[10px] font-medium">{t("nav.settings")}</span>
          </Link>
        </div>
        {/* Safe area */}
        <div className="h-[env(safe-area-inset-bottom)]" />
      </nav>
    </div>
  );
}
