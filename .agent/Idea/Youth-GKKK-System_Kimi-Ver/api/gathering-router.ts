import { z } from "zod";
import { eq, and, isNull, like, desc, sql, gte, lt } from "drizzle-orm";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { gatherings, stewardAssignments } from "@db/schema";

export const gatheringRouter = createRouter({
  list: publicQuery
    .input(
      z.object({
        month: z.string().optional(),
        status: z.string().optional(),
        search: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      }).optional()
    )
    .query(async ({ input }) => {
      const db = getDb();
      const filters = [isNull(gatherings.archivedAt)];

      if (input?.status) {
        filters.push(eq(gatherings.status, input.status as "draft" | "published" | "done"));
      }
      if (input?.search) {
        filters.push(like(gatherings.theme, `%${input.search}%`));
      }
      if (input?.month) {
        const [year, month] = input.month.split("-");
        const startDate = new Date(`${year}-${month}-01`);
        const endMonth = parseInt(month) + 1;
        const endDate = new Date(`${year}-${String(endMonth).padStart(2, "0")}-01`);
        filters.push(gte(gatherings.eventDate, startDate));
        filters.push(lt(gatherings.eventDate, endDate));
      }

      const whereClause = and(...filters);

      const rows = await db.query.gatherings.findMany({
        where: whereClause,
        limit: input?.limit,
        offset: input?.offset,
        orderBy: [desc(gatherings.eventDate)],
        with: {
          stewardAssignments: {
            with: {
              member: true,
            },
          },
        },
      });

      const countResult = await db.select({ count: sql<number>`count(*)` })
        .from(gatherings)
        .where(whereClause);

      return {
        gatherings: rows.map((g) => ({
          ...g,
          stewardCount: g.stewardAssignments.filter((s) => s.memberId && s.status !== "replaced").length,
        })),
        total: countResult[0]?.count ?? 0,
      };
    }),

  getById: publicQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const gathering = await db.query.gatherings.findFirst({
        where: and(eq(gatherings.id, input.id), isNull(gatherings.archivedAt)),
        with: {
          stewardAssignments: {
            orderBy: [stewardAssignments.sortOrder],
            with: {
              member: true,
              replacedBy: true,
            },
          },
          linkedTransactions: true,
        },
      });

      return gathering;
    }),

  create: publicQuery
    .input(
      z.object({
        eventDate: z.string(),
        theme: z.string().min(1),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const [gathering] = await db.insert(gatherings).values({
        eventDate: new Date(input.eventDate),
        theme: input.theme,
        description: input.description || null,
      }).$returningId();

      // Auto-create 6 default steward slots
      const defaultRoles = [
        "Worship Leader",
        "Vocal 1",
        "Vocal 2",
        "Keyboard",
        "Drums",
        "Multimedia",
      ];

      for (let i = 0; i < defaultRoles.length; i++) {
        await db.insert(stewardAssignments).values({
          gatheringId: gathering.id,
          roleName: defaultRoles[i],
          sortOrder: i,
        });
      }

      return { id: gathering.id };
    }),

  update: publicQuery
    .input(
      z.object({
        id: z.number(),
        theme: z.string().min(1).optional(),
        description: z.string().optional(),
        eventDate: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ...data } = input;
      const updateData: any = { ...data, updatedAt: new Date() };
      if (data.eventDate !== undefined) updateData.eventDate = new Date(data.eventDate);
      await db.update(gatherings)
        .set(updateData)
        .where(eq(gatherings.id, id));
      return { success: true };
    }),

  updateStatus: publicQuery
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["draft", "published", "done"]),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.update(gatherings)
        .set({ status: input.status, updatedAt: new Date() })
        .where(eq(gatherings.id, input.id));
      return { success: true };
    }),

  assignSteward: publicQuery
    .input(
      z.object({
        assignmentId: z.number(),
        memberId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.update(stewardAssignments)
        .set({
          memberId: input.memberId,
          status: "confirmed",
          updatedAt: new Date(),
        })
        .where(eq(stewardAssignments.id, input.assignmentId));
      return { success: true };
    }),

  reorderStewards: publicQuery
    .input(
      z.object({
        gatheringId: z.number(),
        assignments: z.array(
          z.object({
            id: z.number(),
            sortOrder: z.number(),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      for (const a of input.assignments) {
        await db.update(stewardAssignments)
          .set({ sortOrder: a.sortOrder })
          .where(eq(stewardAssignments.id, a.id));
      }
      return { success: true };
    }),

  requestChange: publicQuery
    .input(
      z.object({
        assignmentId: z.number(),
        reason: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.update(stewardAssignments)
        .set({
          status: "change_requested",
          changeReason: input.reason,
          updatedAt: new Date(),
        })
        .where(eq(stewardAssignments.id, input.assignmentId));
      return { success: true };
    }),

  approveChange: publicQuery
    .input(
      z.object({
        assignmentId: z.number(),
        replacementMemberId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.update(stewardAssignments)
        .set({
          status: "replaced",
          replacedById: input.replacementMemberId,
          updatedAt: new Date(),
        })
        .where(eq(stewardAssignments.id, input.assignmentId));

      // Create new assignment for replacement
      const existing = await db.query.stewardAssignments.findFirst({
        where: eq(stewardAssignments.id, input.assignmentId),
      });

      if (existing) {
        await db.insert(stewardAssignments).values({
          gatheringId: existing.gatheringId,
          memberId: input.replacementMemberId,
          roleName: existing.roleName,
          sortOrder: existing.sortOrder,
          status: "confirmed",
        });
      }

      return { success: true };
    }),

  delete: publicQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.update(gatherings)
        .set({ archivedAt: new Date() })
        .where(eq(gatherings.id, input.id));
      return { success: true };
    }),
});
