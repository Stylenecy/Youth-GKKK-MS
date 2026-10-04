import {
  LayoutDashboard,
  CalendarDays,
  ClipboardList,
  Users,
  Network,
  UsersRound,
  Wallet,
  NotebookPen,
  History,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { canManageFinance, canViewAudit, type RoleOrDemo } from "@/lib/roles";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  section: "utama" | "admin";
  /** Shown in the phone bottom bar. */
  primary?: boolean;
  /** Hidden for roles whose RLS would only show them an empty page. */
  visible?: (role: RoleOrDemo) => boolean;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, section: "utama", primary: true },
  { href: "/dashboard/cross/mine", label: "Kelompokku", icon: UsersRound, section: "utama", primary: true },
  { href: "/dashboard/gatherings", label: "Ibadah", icon: CalendarDays, section: "utama", primary: true },
  { href: "/dashboard/penatalayan", label: "Penatalayan", icon: ClipboardList, section: "utama" },
  { href: "/dashboard/members", label: "Anggota", icon: Users, section: "utama", primary: true },
  { href: "/dashboard/cross", label: "Cross", icon: Network, section: "utama" },
  { href: "/dashboard/finance", label: "Keuangan", icon: Wallet, section: "admin", visible: canManageFinance },
  { href: "/dashboard/meetings", label: "Rapat", icon: NotebookPen, section: "admin" },
  { href: "/dashboard/audit", label: "Audit", icon: History, section: "admin", visible: canViewAudit },
  { href: "/dashboard/settings", label: "Pengaturan", icon: Settings, section: "admin" },
];

/** Menu for one role. `null` = demo mode: everything, for preview. */
export function navFor(role: RoleOrDemo): NavItem[] {
  return NAV_ITEMS.filter((i) => !i.visible || i.visible(role));
}

function matches(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * The most specific item wins: /dashboard/cross/mine lights "Kelompokku"
 * only, not "Cross" as well (one aria-current per menu).
 */
export function isActive(pathname: string, href: string): boolean {
  if (!matches(pathname, href)) return false;
  return !NAV_ITEMS.some((i) => i.href.length > href.length && matches(pathname, i.href));
}
