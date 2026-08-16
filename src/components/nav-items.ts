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
  /** Shown in the phone bottom bar. */
  primary?: boolean;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, primary: true },
  { href: "/dashboard/cross/mine", label: "Kelompokku", icon: UsersRound, primary: true },
  { href: "/dashboard/gatherings", label: "Ibadah", icon: CalendarDays, primary: true },
  { href: "/dashboard/members", label: "Anggota", icon: Users, primary: true },
  { href: "/dashboard/cross", label: "Cross", icon: Network },
  { href: "/dashboard/finance", label: "Keuangan", icon: Wallet },
  { href: "/dashboard/meetings", label: "Rapat", icon: NotebookPen },
  { href: "/dashboard/audit", label: "Audit", icon: History },
  { href: "/dashboard/settings", label: "Pengaturan", icon: Settings },
];

export function isActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}
