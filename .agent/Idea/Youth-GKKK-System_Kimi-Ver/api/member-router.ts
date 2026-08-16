import { z } from "zod";
import { eq, and, like, sql, gte, desc, isNull } from "drizzle-orm";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { members, memberSkills, crossMemberships, stewardAssignments, gatherings } from "@db/schema";

export const memberRouter = createRouter({
  list: publicQuery
    .input(
      z.object({
        status: z.string().optional(),
        crossId: z.number().optional(),
        skillId: z.number().optional(),
        search: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      }).optional()
    )
    .query(async ({ input }) => {
      const db = getDb();
      const filters = [];

      if (input?.status) {
        filters.push(eq(members.status, input.status as "active" | "away" | "alumni" | "inactive"));
      }
      if (input?.search) {
        filters.push(like(members.fullName, `%${input.search}%`));
      }

      filters.push(isNull(members.archivedAt));

      const whereClause = filters.length > 0 ? and(...filters) : undefined;

      const rows = await db.query.members.findMany({
        where: whereClause,
        limit: input?.limit,
        offset: input?.offset,
        orderBy: [members.fullName],
        with: {
          skills: {
            with: {
              skill: {
                with: {
                  category: true,
                },
              },
            },
          },
          memberships: {
            where: isNull(crossMemberships.endDate),
            with: {
              cross: true,
            },
          },
        },
      });

      const countResult = await db.select({ count: sql<number>`count(*)` })
        .from(members)
        .where(whereClause);

      return {
        members: rows,
        total: countResult[0]?.count ?? 0,
      };
    }),

  getById: publicQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const member = await db.query.members.findFirst({
        where: and(eq(members.id, input.id), isNull(members.archivedAt)),
        with: {
          skills: {
            with: {
              skill: {
                with: {
                  category: true,
                },
              },
            },
          },
          memberships: {
            where: isNull(crossMemberships.endDate),
            with: {
              cross: true,
            },
          },
        },
      });

      if (!member) return null;

      const serviceHistory = await db.query.stewardAssignments.findMany({
        where: eq(stewardAssignments.memberId, input.id),
        orderBy: [desc(stewardAssignments.createdAt)],
        limit: 10,
        with: {
          gathering: true,
        },
      });

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const fatigueResult = await db.select({ count: sql<number>`count(*)` })
        .from(stewardAssignments)
        .innerJoin(gatherings, eq(stewardAssignments.gatheringId, gatherings.id))
        .where(
          and(
            eq(stewardAssignments.memberId, input.id),
            gte(gatherings.eventDate, thirtyDaysAgo)
          )
        );

      return {
        ...member,
        serviceHistory,
        fatigueCount: fatigueResult[0]?.count ?? 0,
      };
    }),

  create: publicQuery
    .input(
      z.object({
        fullName: z.string().min(1),
        nickname: z.string().optional(),
        whatsapp: z.string().optional(),
        birthDate: z.string().optional(),
        hometown: z.string().optional(),
        university: z.string().optional(),
        cohort: z.string().optional(),
        status: z.enum(["active", "away", "alumni", "inactive"]).default("active"),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const [member] = await db.insert(members).values({
        fullName: input.fullName,
        nickname: input.nickname || null,
        whatsapp: input.whatsapp || null,
        birthDate: input.birthDate ? new Date(input.birthDate) : null,
        hometown: input.hometown || null,
        university: input.university || null,
        cohort: input.cohort || null,
        status: input.status,
      }).$returningId();

      return { id: member.id };
    }),

  update: publicQuery
    .input(
      z.object({
        id: z.number(),
        fullName: z.string().min(1).optional(),
        nickname: z.string().optional(),
        whatsapp: z.string().optional(),
        birthDate: z.string().optional(),
        hometown: z.string().optional(),
        university: z.string().optional(),
        cohort: z.string().optional(),
        status: z.enum(["active", "away", "alumni", "inactive"]).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ...data } = input;

      const updateData: any = {
        ...data,
        updatedAt: new Date(),
      };
      if (data.birthDate !== undefined) updateData.birthDate = data.birthDate ? new Date(data.birthDate) : null;

      await db.update(members)
        .set(updateData)
        .where(eq(members.id, id));

      return { success: true };
    }),

  archive: publicQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.update(members)
        .set({ archivedAt: new Date() })
        .where(eq(members.id, input.id));
      return { success: true };
    }),

  updateSkills: publicQuery
    .input(
      z.object({
        memberId: z.number(),
        skills: z.array(
          z.object({
            skillId: z.number(),
            proficiencyLevel: z.enum(["beginner", "intermediate", "advanced"]),
            isPrimary: z.boolean(),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();

      await db.delete(memberSkills).where(eq(memberSkills.memberId, input.memberId));

      if (input.skills.length > 0) {
        await db.insert(memberSkills).values(
          input.skills.map((s) => ({
            memberId: input.memberId,
            skillId: s.skillId,
            proficiencyLevel: s.proficiencyLevel,
            isPrimary: s.isPrimary,
          }))
        );
      }

      return { success: true };
    }),
});
