import { z } from "zod";
import { eq, and, desc, sql, gte, lte } from "drizzle-orm";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { auditLog } from "@db/schema";

export const auditRouter = createRouter({
  list: publicQuery
    .input(
      z.object({
        module: z.string().optional(),
        actorId: z.number().optional(),
        dateFrom: z.string().optional(),
        dateTo: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      }).optional()
    )
    .query(async ({ input }) => {
      const db = getDb();
      const conditions = [];

      if (input?.module) {
        conditions.push(eq(auditLog.module, input.module as any));
      }
      if (input?.actorId) {
        conditions.push(eq(auditLog.actorId, input.actorId));
      }
      if (input?.dateFrom) {
        conditions.push(gte(auditLog.createdAt, new Date(input.dateFrom)));
      }
      if (input?.dateTo) {
        conditions.push(lte(auditLog.createdAt, new Date(input.dateTo)));
      }

      const whereClause = conditions.length > 1
        ? and(...conditions)
        : conditions.length === 1
          ? conditions[0]
          : undefined;

      const rows = await db.query.auditLog.findMany({
        where: whereClause,
        limit: input?.limit,
        offset: input?.offset,
        orderBy: [desc(auditLog.createdAt)],
        with: {
          actor: true,
        },
      });

      const countResult = await db.select({ count: sql<number>`count(*)` })
        .from(auditLog)
        .where(whereClause);

      return {
        entries: rows,
        total: countResult[0]?.count ?? 0,
      };
    }),

  getByRecord: publicQuery
    .input(
      z.object({
        module: z.string(),
        recordId: z.number(),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();
      return db.query.auditLog.findMany({
        where: and(
          eq(auditLog.module, input.module as any),
          eq(auditLog.recordId, input.recordId)
        ),
        orderBy: [desc(auditLog.createdAt)],
        with: {
          actor: true,
        },
      });
    }),

  create: publicQuery
    .input(
      z.object({
        actorId: z.number().optional(),
        action: z.string().min(1),
        module: z.enum(["gatherings", "members", "finance", "meetings", "cross", "skills", "settings"]),
        recordId: z.number().optional(),
        recordType: z.string().optional(),
        oldValues: z.record(z.string(), z.any()).optional(),
        newValues: z.record(z.string(), z.any()).optional(),
        description: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const [entry] = await db.insert(auditLog).values({
        actorId: input.actorId || null,
        action: input.action,
        module: input.module,
        recordId: input.recordId || null,
        recordType: input.recordType || null,
        oldValues: input.oldValues || null,
        newValues: input.newValues || null,
        description: input.description,
      }).$returningId();
      return { id: entry.id };
    }),
});
