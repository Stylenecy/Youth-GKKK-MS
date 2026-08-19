export type MemberStatus = "active" | "away" | "alumni" | "inactive";
export type EventStatus = "draft" | "published" | "completed" | "archived";
export type EventType = "worship" | "cross" | "talkshow" | "movie" | "sports" | "retreat" | "special";
export type StewardStatus = "assigned" | "confirmed" | "change_requested" | "replaced";
export type ProficiencyLevel = "beginner" | "intermediate" | "advanced";
export type FinanceType = "income" | "expense";
// Category set mirrors Nathan's kas spreadsheet chart of accounts — see
// src/lib/finance.ts for the label list actually used in the UI.
export type FinanceAccount = "kas_besar" | "kas_kecil";

export type AppRole = "admin" | "treasurer" | "leader" | "ministry" | "member";

export interface Profile {
  id: string;
  fullName: string;
  nickname: string;
  // Nullable: a quick-added member starts with a name and nothing else.
  // Filling these in later is optional, never a blocker to being tracked.
  whatsapp: string | null;
  birthDate: string | null;
  hometown: string | null;
  university: string | null;
  cohort: string | null;
  status: MemberStatus;
  /** Roster "Keterangan" — why someone is away, e.g. "Kuliah di luar". */
  notes: string | null;
  avatarUrl: string | null;
  serviceCount30d: number;
  createdAt: string;
  updatedAt: string;
  /** Not a DB column — set only for the signed-in user's own profile. */
  appRole?: AppRole;
}

export interface Skill {
  id: string;
  profileId: string;
  category: string;
  skillName: string;
  proficiencyLevel: ProficiencyLevel;
  isPrimary: boolean;
  lastUsed: string;
}

export interface MonthlyTheme {
  id: string;
  month: string;
  year: number;
  theme: string;
  description: string;
}

export interface Event {
  id: string;
  date: string;
  // Nullable in the database, and genuinely often empty: an event can be
  // created before anyone is put in charge of it or a monthly theme exists.
  monthlyThemeId: string | null;
  weeklyTheme: string;
  eventType: EventType;
  picId: string | null;
  speakerName: string | null;
  description: string | null;
  status: EventStatus;
  archivedAt: string | null;
}

export interface StewardAssignment {
  id: string;
  eventId: string;
  profileId: string;
  role: string;
  status: StewardStatus;
  reason: string | null;
  createdAt: string;
  member?: Profile;
}

export interface Cross {
  id: string;
  name: string;
  // Legacy single-leader pointer, kept for old callers. A group's real
  // leader set is every active `role: "leader"` row in cross_memberships —
  // see getCrossLeaders(). Use that when a group can be co-led.
  leaderId: string | null;
  description: string;
  meetingDay: string;
  meetingTime: string;
  memberCount: number;
}

export type CrossMembershipRole = "leader" | "member";

export interface CrossMembership {
  id: string;
  profileId: string;
  crossId: string;
  // A group can have more than one leader (e.g. co-led by two people) —
  // this is a role on the membership row, not a single FK on the group.
  role: CrossMembershipRole;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
}

export interface FinanceTransaction {
  id: string;
  eventId: string | null;
  amount: number;
  type: FinanceType;
  account: FinanceAccount;
  category: string;
  description: string;
  receiptUrl: string | null;
  recordedById: string | null;
  createdAt: string;
}

export interface Meeting {
  id: string;
  title: string;
  date: string;
  content: string;
  participants: string[];
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValue: string | null;
  newValue: string | null;
  timestamp: string;
}

export interface DashboardStats {
  totalMembers: number;
  activeCrossGroups: number;
  monthGatherings: number;
  /** Running balance over every non-deleted transaction, not just this month. */
  totalBalance: number;
}

export interface FatigueAlert {
  member: Profile;
  serviceCount: number;
}

export interface RecentActivity {
  id: string;
  description: string;
  createdAt: string;
}
