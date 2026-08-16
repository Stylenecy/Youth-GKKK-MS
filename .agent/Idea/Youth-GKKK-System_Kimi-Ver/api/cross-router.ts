import { z } from "zod";
import { eq, and, isNull } from "drizzle-orm";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { crossGroups, crossMemberships } from "@db/schema";

export const crossRouter = createRouter({
  list: publicQuery.query(async () => {
    const db = getDb();
    const groups = await db.query.crossGroups.findMany({
      where: isNull(crossGroups.archivedAt),
      orderBy: [crossGroups.name],
      with: {
        leader: true,
        memberships: {
          where: isNull(crossMemberships.endDate),
          with: {
            member: true,
          },
        },
      },
    });

    return groups.map((g) => ({
      ...g,
      memberCount: g.memberships.length,
    }));
  }),

  getById: publicQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      return db.query.crossGroups.findFirst({
        where: and(eq(crossGroups.id, input.id), isNull(crossGroups.archivedAt)),
        with: {
          leader: true,
          memberships: {
            where: isNull(crossMemberships.endDate),
            with: {
              member: true,
            },
          },
        },
      });
    }),

  create: publicQuery
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        leaderId: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const [group] = await db.insert(crossGroups).values({
        name: input.name,
        description: input.description || null,
        leaderId: input.leaderId || null,
      }).$returningId();
      return { id: group.id };
    }),

  update: publicQuery
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        leaderId: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ...data } = input;
      await db.update(crossGroups).set(data).where(eq(crossGroups.id, id));
      return { success: true };
    }),

  addMember: publicQuery
    .input(
      z.object({
        crossId: z.number(),
        memberId: z.number(),
        startDate: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const [membership] = await db.insert(crossMemberships).values({
        crossId: input.crossId,
        memberId: input.memberId,
        startDate: new Date(input.startDate),
      }).$returningId();
      return { id: membership.id };
    }),

  removeMember: publicQuery
    .input(z.object({ membershipId: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.update(crossMemberships)
        .set({ endDate: new Date() })
        .where(eq(crossMemberships.id, input.membershipId));
      return { success: true };
    }),
});
