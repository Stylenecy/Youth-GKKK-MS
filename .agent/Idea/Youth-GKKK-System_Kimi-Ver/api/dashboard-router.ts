import { z } from "zod";
import { sql, and, eq, gte, lt, isNull, desc } from "drizzle-orm";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { members, crossGroups, gatherings, transactions, stewardAssignments, auditLog } from "@db/schema";

export const dashboardRouter = createRouter({
  getStats: publicQuery.query(async () => {
    const db = getDb();

    const memberCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(members)
      .where(and(eq(members.status, "active"), isNull(members.archivedAt)));

    const crossCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(crossGroups)
      .where(isNull(crossGroups.archivedAt));

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const startDate = new Date(`${year}-${month}-01`);
    const endMonthNum = now.getMonth() + 2;
    const endDate = new Date(`${year}-${String(endMonthNum).padStart(2, "0")}-01`);

    const gatheringCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(gatherings)
      .where(
        and(
          gte(gatherings.eventDate, startDate),
          lt(gatherings.eventDate, endDate),
          isNull(gatherings.archivedAt)
        )
      );

    const incomeResult = await db
      .select({ total: sql<number>`COALESCE(SUM(amount), 0)` })
      .from(transactions)
      .where(
        and(
          eq(transactions.type, "income"),
          gte(transactions.transactionDate, startDate),
          lt(transactions.transactionDate, endDate)
        )
      );

    const expenseResult = await db
      .select({ total: sql<number>`COALESCE(SUM(ABS(amount)), 0)` })
      .from(transactions)
      .where(
        and(
          eq(transactions.type, "expense"),
          gte(transactions.transactionDate, startDate),
          lt(transactions.transactionDate, endDate)
        )
      );

    return {
      totalMembers: memberCount[0]?.count ?? 0,
      activeCrossGroups: crossCount[0]?.count ?? 0,
      monthGatherings: gatheringCount[0]?.count ?? 0,
      monthlyBalance: (incomeResult[0]?.total ?? 0) - (expenseResult[0]?.total ?? 0),
    };
  }),

  getRecentActivity: publicQuery
    .input(
      z.object({ limit: z.number().min(1).max(50).default(10) }).optional()
    )
    .query(async ({ input }) => {
      const db = getDb();
      return db.query.auditLog.findMany({
        orderBy: [desc(auditLog.createdAt)],
        limit: input?.limit ?? 10,
        with: {
          actor: true,
        },
      });
    }),

  getFatigueAlerts: publicQuery.query(async () => {
    const db = getDb();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const rows = await db
      .select({
        memberId: stewardAssignments.memberId,
        count: sql<number>`count(*)`,
      })
      .from(stewardAssignments)
      .innerJoin(gatherings, eq(stewardAssignments.gatheringId, gatherings.id))
      .where(gte(gatherings.eventDate, thirtyDaysAgo))
      .groupBy(stewardAssignments.memberId)
      .having(sql`count(*) >= 3`);

    const alerts = [];
    for (const row of rows) {
      if (row.memberId) {
        const member = await db.query.members.findFirst({
          where: eq(members.id, row.memberId),
        });
        if (member) {
          alerts.push({
            member,
            serviceCount: row.count,
          });
        }
      }
    }

    return alerts;
  }),

  getUpcomingGathering: publicQuery.query(async () => {
    const db = getDb();
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return db.query.gatherings.findFirst({
      where: and(
        gte(gatherings.eventDate, today),
        isNull(gatherings.archivedAt)
      ),
      orderBy: [gatherings.eventDate],
      with: {
        stewardAssignments: {
          with: {
            member: true,
          },
        },
      },
    });
  }),
});
