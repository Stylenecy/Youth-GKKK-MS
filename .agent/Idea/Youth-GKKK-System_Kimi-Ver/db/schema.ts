import {
  mysqlTable,
  mysqlEnum,
  serial,
  varchar,
  text,
  timestamp,
  bigint,
  decimal,
  json,
  date,
  boolean,
  int,
} from "drizzle-orm/mysql-core";

// ─── Members ───
export const members = mysqlTable("members", {
  id: serial("id").primaryKey(),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  nickname: varchar("nickname", { length: 100 }),
  whatsapp: varchar("whatsapp", { length: 20 }),
  birthDate: date("birth_date"),
  hometown: varchar("hometown", { length: 255 }),
  university: varchar("university", { length: 255 }),
  cohort: varchar("cohort", { length: 50 }),
  status: mysqlEnum("status", ["active", "away", "alumni", "inactive"]).default("active").notNull(),
  avatarUrl: varchar("avatar_url", { length: 500 }),
  role: mysqlEnum("role", ["member", "committee", "super_admin"]).default("member").notNull(),
  isApproved: boolean("is_approved").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
  archivedAt: timestamp("archived_at"),
});

// ─── Skill Categories ───
export const skillCategories = mysqlTable("skill_categories", {
  id: serial("id").primaryKey(),
  nameEn: varchar("name_en", { length: 100 }).notNull(),
  nameId: varchar("name_id", { length: 100 }).notNull(),
  icon: varchar("icon", { length: 50 }),
  sortOrder: int("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Skills ───
export const skills = mysqlTable("skills", {
  id: serial("id").primaryKey(),
  categoryId: bigint("category_id", { mode: "number", unsigned: true }).notNull(),
  nameEn: varchar("name_en", { length: 100 }).notNull(),
  nameId: varchar("name_id", { length: 100 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Member Skills ───
export const memberSkills = mysqlTable("member_skills", {
  id: serial("id").primaryKey(),
  memberId: bigint("member_id", { mode: "number", unsigned: true }).notNull(),
  skillId: bigint("skill_id", { mode: "number", unsigned: true }).notNull(),
  proficiencyLevel: mysqlEnum("proficiency_level", ["beginner", "intermediate", "advanced"]).default("beginner").notNull(),
  isPrimary: boolean("is_primary").default(false).notNull(),
  lastUsed: date("last_used"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Cross Groups ───
export const crossGroups = mysqlTable("cross_groups", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  leaderId: bigint("leader_id", { mode: "number", unsigned: true }),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  archivedAt: timestamp("archived_at"),
});

// ─── Cross Memberships ───
export const crossMemberships = mysqlTable("cross_memberships", {
  id: serial("id").primaryKey(),
  crossId: bigint("cross_id", { mode: "number", unsigned: true }).notNull(),
  memberId: bigint("member_id", { mode: "number", unsigned: true }).notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Gatherings (Saturday Gathering) ───
export const gatherings = mysqlTable("gatherings", {
  id: serial("id").primaryKey(),
  eventDate: date("event_date").notNull(),
  theme: varchar("theme", { length: 255 }).notNull(),
  description: text("description"),
  status: mysqlEnum("status", ["draft", "published", "done"]).default("draft").notNull(),
  createdBy: bigint("created_by", { mode: "number", unsigned: true }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
  archivedAt: timestamp("archived_at"),
});

// ─── Steward Assignments ───
export const stewardAssignments = mysqlTable("steward_assignments", {
  id: serial("id").primaryKey(),
  gatheringId: bigint("gathering_id", { mode: "number", unsigned: true }).notNull(),
  memberId: bigint("member_id", { mode: "number", unsigned: true }),
  roleName: varchar("role_name", { length: 100 }).notNull(),
  sortOrder: int("sort_order").default(0),
  status: mysqlEnum("status", ["assigned", "confirmed", "change_requested", "replaced"]).default("confirmed").notNull(),
  changeReason: text("change_reason"),
  replacedById: bigint("replaced_by_id", { mode: "number", unsigned: true }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
});

// ─── Transactions (Finance) ───
export const transactions = mysqlTable("transactions", {
  id: serial("id").primaryKey(),
  transactionDate: date("transaction_date").notNull(),
  description: varchar("description", { length: 500 }).notNull(),
  category: mysqlEnum("category", [
    "cash_offering", "qris", "donation",
    "food", "gifts", "event_supplies", "equipment", "transport",
  ]).notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  type: mysqlEnum("type", ["income", "expense"]).notNull(),
  receiptUrl: varchar("receipt_url", { length: 500 }),
  linkedGatheringId: bigint("linked_gathering_id", { mode: "number", unsigned: true }),
  createdBy: bigint("created_by", { mode: "number", unsigned: true }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
});

// ─── Meetings ───
export const meetings = mysqlTable("meetings", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  meetingDate: date("meeting_date").notNull(),
  status: mysqlEnum("status", ["draft", "in_progress", "completed"]).default("draft").notNull(),
  agendaData: json("agenda_data").$type<AgendaItem[]>(),
  notes: text("notes"),
  createdBy: bigint("created_by", { mode: "number", unsigned: true }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
});

export type AgendaItem = {
  id: string;
  title: string;
  timeAllocation: number;
  status: "pending" | "discussed";
  order: number;
};

// ─── Meeting Action Items ───
export const meetingActionItems = mysqlTable("meeting_action_items", {
  id: serial("id").primaryKey(),
  meetingId: bigint("meeting_id", { mode: "number", unsigned: true }).notNull(),
  description: text("description").notNull(),
  assigneeId: bigint("assignee_id", { mode: "number", unsigned: true }),
  dueDate: date("due_date"),
  status: mysqlEnum("status", ["open", "closed"]).default("open").notNull(),
  highlightedText: varchar("highlighted_text", { length: 500 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Audit Log ───
export const auditLog = mysqlTable("audit_log", {
  id: serial("id").primaryKey(),
  actorId: bigint("actor_id", { mode: "number", unsigned: true }),
  action: varchar("action", { length: 50 }).notNull(),
  module: mysqlEnum("module", ["gatherings", "members", "finance", "meetings", "cross", "skills", "settings"]).notNull(),
  recordId: bigint("record_id", { mode: "number", unsigned: true }),
  recordType: varchar("record_type", { length: 50 }),
  oldValues: json("old_values"),
  newValues: json("new_values"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Types ───
export type Member = typeof members.$inferSelect;
export type InsertMember = typeof members.$inferInsert;
export type SkillCategory = typeof skillCategories.$inferSelect;
export type Skill = typeof skills.$inferSelect;
export type MemberSkill = typeof memberSkills.$inferSelect;
export type CrossGroup = typeof crossGroups.$inferSelect;
export type CrossMembership = typeof crossMemberships.$inferSelect;
export type Gathering = typeof gatherings.$inferSelect;
export type StewardAssignment = typeof stewardAssignments.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type Meeting = typeof meetings.$inferSelect;
export type MeetingActionItem = typeof meetingActionItems.$inferSelect;
export type AuditLog = typeof auditLog.$inferSelect;
