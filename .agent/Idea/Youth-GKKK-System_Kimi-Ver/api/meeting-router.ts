import { z } from "zod";
import { eq, desc, sql, and } from "drizzle-orm";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { meetings, meetingActionItems } from "@db/schema";

export const meetingRouter = createRouter({
  list: publicQuery
    .input(
      z.object({
        status: z.string().optional(),
        search: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      }).optional()
    )
    .query(async ({ input }) => {
      const db = getDb();
      const conditions = [];

      if (input?.status) {
        conditions.push(eq(meetings.status, input.status as "draft" | "in_progress" | "completed"));
      }

      const whereClause = conditions.length > 1
        ? and(...conditions)
        : conditions.length === 1
          ? conditions[0]
          : undefined;

      const rows = await db.query.meetings.findMany({
        where: whereClause,
        limit: input?.limit,
        offset: input?.offset,
        orderBy: [desc(meetings.meetingDate)],
        with: {
          actionItems: true,
        },
      });

      const countResult = await db.select({ count: sql<number>`count(*)` })
        .from(meetings)
        .where(whereClause);

      return {
        meetings: rows,
        total: countResult[0]?.count ?? 0,
      };
    }),

  getById: publicQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      return db.query.meetings.findFirst({
        where: eq(meetings.id, input.id),
        with: {
          actionItems: {
            with: {
              assignee: true,
            },
          },
          creator: true,
        },
      });
    }),

  create: publicQuery
    .input(
      z.object({
        title: z.string().min(1),
        meetingDate: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const [meeting] = await db.insert(meetings).values({
        title: input.title,
        meetingDate: new Date(input.meetingDate),
      }).$returningId();
      return { id: meeting.id };
    }),

  update: publicQuery
    .input(
      z.object({
        id: z.number(),
        title: z.string().min(1).optional(),
        notes: z.string().optional(),
        agendaData: z.array(
          z.object({
            id: z.string(),
            title: z.string(),
            timeAllocation: z.number(),
            status: z.enum(["pending", "discussed"]),
            order: z.number(),
          })
        ).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ...data } = input;
      await db.update(meetings)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(meetings.id, id));
      return { success: true };
    }),

  updateStatus: publicQuery
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["draft", "in_progress", "completed"]),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.update(meetings)
        .set({ status: input.status })
        .where(eq(meetings.id, input.id));
      return { success: true };
    }),

  createActionItem: publicQuery
    .input(
      z.object({
        meetingId: z.number(),
        description: z.string().min(1),
        assigneeId: z.number().optional(),
        dueDate: z.string().optional(),
        highlightedText: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const [item] = await db.insert(meetingActionItems).values({
        meetingId: input.meetingId,
        description: input.description,
        assigneeId: input.assigneeId || null,
        dueDate: input.dueDate ? new Date(input.dueDate) : null,
        highlightedText: input.highlightedText || null,
      }).$returningId();
      return { id: item.id };
    }),

  updateActionItem: publicQuery
    .input(
      z.object({
        id: z.number(),
        description: z.string().optional(),
        assigneeId: z.number().optional(),
        dueDate: z.string().optional(),
        status: z.enum(["open", "closed"]).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ...data } = input;
      const updateData: any = { ...data };
      if (data.dueDate !== undefined) updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
      await db.update(meetingActionItems)
        .set(updateData)
        .where(eq(meetingActionItems.id, id));
      return { success: true };
    }),
});
