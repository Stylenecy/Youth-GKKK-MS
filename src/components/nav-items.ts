import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Network,
  UsersRound,
  Wallet,
  NotebookPen,
  History,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  section: "utama" | "admin";
  /** Shown in the phone bottom bar. */
  primary?: boolean;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, section: "utama", primary: true },
  { href: "/dashboard/cross/mine", label: "Kelompokku", icon: UsersRound, section: "utama", primary: true },
  { href: "/dashboard/gatherings", label: "Ibadah", icon: CalendarDays, section: "utama", primary: true },
  { href: "/dashboard/members", label: "Anggota", icon: Users, section: "utama", primary: true },
  { href: "/dashboard/cross", label: "Cross", icon: Network, section: "utama" },
  { href: "/dashboard/finance", label: "Keuangan", icon: Wallet, section: "admin" },
  { href: "/dashboard/meetings", label: "Rapat", icon: NotebookPen, section: "admin" },
  { href: "/dashboard/audit", label: "Audit", icon: History, section: "admin" },
  { href: "/dashboard/settings", label: "Pengaturan", icon: Settings, section: "admin" },
];

export function isActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}
