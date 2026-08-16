import { relations } from "drizzle-orm";
import {
  members,
  skillCategories,
  skills,
  memberSkills,
  crossGroups,
  crossMemberships,
  gatherings,
  stewardAssignments,
  transactions,
  meetings,
  meetingActionItems,
  auditLog,
} from "./schema";

export const membersRelations = relations(members, ({ many, one }) => ({
  skills: many(memberSkills),
  memberships: many(crossMemberships),
  createdGatherings: many(gatherings, { relationName: "createdBy" }),
  stewardAssignments: many(stewardAssignments),
  createdTransactions: many(transactions, { relationName: "txCreatedBy" }),
  createdMeetings: many(meetings, { relationName: "meetingCreatedBy" }),
  actionItems: many(meetingActionItems),
  auditEntries: many(auditLog),
  ledCrossGroup: one(crossGroups, {
    fields: [members.id],
    references: [crossGroups.leaderId],
  }),
}));

export const skillCategoriesRelations = relations(skillCategories, ({ many }) => ({
  skills: many(skills),
}));

export const skillsRelations = relations(skills, ({ one, many }) => ({
  category: one(skillCategories, {
    fields: [skills.categoryId],
    references: [skillCategories.id],
  }),
  memberSkills: many(memberSkills),
}));

export const memberSkillsRelations = relations(memberSkills, ({ one }) => ({
  member: one(members, {
    fields: [memberSkills.memberId],
    references: [members.id],
  }),
  skill: one(skills, {
    fields: [memberSkills.skillId],
    references: [skills.id],
  }),
}));

export const crossGroupsRelations = relations(crossGroups, ({ one, many }) => ({
  leader: one(members, {
    fields: [crossGroups.leaderId],
    references: [members.id],
  }),
  memberships: many(crossMemberships),
}));

export const crossMembershipsRelations = relations(crossMemberships, ({ one }) => ({
  cross: one(crossGroups, {
    fields: [crossMemberships.crossId],
    references: [crossGroups.id],
  }),
  member: one(members, {
    fields: [crossMemberships.memberId],
    references: [members.id],
  }),
}));

export const gatheringsRelations = relations(gatherings, ({ one, many }) => ({
  creator: one(members, {
    fields: [gatherings.createdBy],
    references: [members.id],
    relationName: "createdBy",
  }),
  stewardAssignments: many(stewardAssignments),
  linkedTransactions: many(transactions, { relationName: "linkedGathering" }),
}));

export const stewardAssignmentsRelations = relations(stewardAssignments, ({ one }) => ({
  gathering: one(gatherings, {
    fields: [stewardAssignments.gatheringId],
    references: [gatherings.id],
  }),
  member: one(members, {
    fields: [stewardAssignments.memberId],
    references: [members.id],
  }),
  replacedBy: one(members, {
    fields: [stewardAssignments.replacedById],
    references: [members.id],
  }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  creator: one(members, {
    fields: [transactions.createdBy],
    references: [members.id],
    relationName: "txCreatedBy",
  }),
  gathering: one(gatherings, {
    fields: [transactions.linkedGatheringId],
    references: [gatherings.id],
    relationName: "linkedGathering",
  }),
}));

export const meetingsRelations = relations(meetings, ({ one, many }) => ({
  creator: one(members, {
    fields: [meetings.createdBy],
    references: [members.id],
    relationName: "meetingCreatedBy",
  }),
  actionItems: many(meetingActionItems),
}));

export const meetingActionItemsRelations = relations(meetingActionItems, ({ one }) => ({
  meeting: one(meetings, {
    fields: [meetingActionItems.meetingId],
    references: [meetings.id],
  }),
  assignee: one(members, {
    fields: [meetingActionItems.assigneeId],
    references: [members.id],
  }),
}));

export const auditLogRelations = relations(auditLog, ({ one }) => ({
  actor: one(members, {
    fields: [auditLog.actorId],
    references: [members.id],
  }),
}));
