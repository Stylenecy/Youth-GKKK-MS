import { z } from "zod";
import { eq, and, sql, desc, gte, lt, lte } from "drizzle-orm";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { transactions } from "@db/schema";

export const financeRouter = createRouter({
  getSnapshot: publicQuery
    .input(
      z.object({
        month: z.string().optional(),
        year: z.number().optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      const db = getDb();
      const now = new Date();
      const year = input?.year ?? now.getFullYear();
      const month = input?.month ?? String(now.getMonth() + 1).padStart(2, "0");

      const startDate = new Date(`${year}-${month}-01`);
      const endMonthNum = parseInt(month) + 1;
      const endDate = new Date(`${year}-${String(endMonthNum).padStart(2, "0")}-01`);

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

      const totalIncome = incomeResult[0]?.total ?? 0;
      const totalExpense = expenseResult[0]?.total ?? 0;

      return {
        totalIncome,
        totalExpense,
        balance: totalIncome - totalExpense,
      };
    }),

  getTrend: publicQuery
    .input(z.object({ months: z.number().min(1).max(24).default(6) }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const months = input?.months ?? 6;
      const results = [];

      for (let i = months - 1; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const startDate = new Date(`${year}-${month}-01`);
        const endMonthNum = d.getMonth() + 2;
        const endDate = new Date(`${year}-${String(endMonthNum).padStart(2, "0")}-01`);

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

        const income = incomeResult[0]?.total ?? 0;
        const expense = expenseResult[0]?.total ?? 0;

        results.push({
          month: `${year}-${month}`,
          income,
          expense,
          balance: income - expense,
        });
      }

      return results;
    }),

  getCategoryBreakdown: publicQuery
    .input(
      z.object({
        month: z.string().optional(),
        year: z.number().optional(),
        type: z.enum(["income", "expense"]),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();
      const now = new Date();
      const year = input.year ?? now.getFullYear();
      const month = input.month ?? String(now.getMonth() + 1).padStart(2, "0");
      const startDate = new Date(`${year}-${month}-01`);
      const endMonthNum = parseInt(month) + 1;
      const endDate = new Date(`${year}-${String(endMonthNum).padStart(2, "0")}-01`);

      const rows = await db
        .select({
          category: transactions.category,
          total: sql<number>`COALESCE(SUM(${input.type === "income" ? transactions.amount : sql`ABS(${transactions.amount})`}), 0)`,
        })
        .from(transactions)
        .where(
          and(
            eq(transactions.type, input.type),
            gte(transactions.transactionDate, startDate),
            lt(transactions.transactionDate, endDate)
          )
        )
        .groupBy(transactions.category);

      return rows;
    }),

  list: publicQuery
    .input(
      z.object({
        dateFrom: z.string().optional(),
        dateTo: z.string().optional(),
        category: z.string().optional(),
        type: z.enum(["income", "expense"]).optional(),
        search: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      }).optional()
    )
    .query(async ({ input }) => {
      const db = getDb();
      const filters = [];

      if (input?.dateFrom) filters.push(gte(transactions.transactionDate, new Date(input.dateFrom)));
      if (input?.dateTo) filters.push(lte(transactions.transactionDate, new Date(input.dateTo)));
      if (input?.category) filters.push(eq(transactions.category, input.category as any));
      if (input?.type) filters.push(eq(transactions.type, input.type));
      if (input?.search) filters.push(sql`${transactions.description} LIKE ${`%${input.search}%`}`);

      const whereClause = filters.length > 0 ? and(...filters) : undefined;

      const rows = await db.query.transactions.findMany({
        where: whereClause,
        limit: input?.limit,
        offset: input?.offset,
        orderBy: [desc(transactions.transactionDate)],
        with: {
          gathering: true,
        },
      });

      const countResult = await db.select({ count: sql<number>`count(*)` })
        .from(transactions)
        .where(whereClause);

      return {
        transactions: rows,
        total: countResult[0]?.count ?? 0,
      };
    }),

  getById: publicQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      return db.query.transactions.findFirst({
        where: eq(transactions.id, input.id),
        with: {
          gathering: true,
        },
      });
    }),

  create: publicQuery
    .input(
      z.object({
        transactionDate: z.string(),
        description: z.string().min(1),
        category: z.enum(["cash_offering", "qris", "donation", "food", "gifts", "event_supplies", "equipment", "transport"]),
        amount: z.number().min(0),
        type: z.enum(["income", "expense"]),
        receiptUrl: z.string().optional(),
        linkedGatheringId: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const [tx] = await db.insert(transactions).values({
        transactionDate: new Date(input.transactionDate),
        description: input.description,
        category: input.category,
        amount: String(input.amount),
        type: input.type,
        receiptUrl: input.receiptUrl || null,
        linkedGatheringId: input.linkedGatheringId || null,
      }).$returningId();
      return { id: tx.id };
    }),

  update: publicQuery
    .input(
      z.object({
        id: z.number(),
        transactionDate: z.string().optional(),
        description: z.string().optional(),
        category: z.enum(["cash_offering", "qris", "donation", "food", "gifts", "event_supplies", "equipment", "transport"]).optional(),
        amount: z.number().optional(),
        type: z.enum(["income", "expense"]).optional(),
        receiptUrl: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ...data } = input;
      const updateData: any = { ...data };
      if (data.transactionDate !== undefined) updateData.transactionDate = new Date(data.transactionDate);
      if (data.amount !== undefined) updateData.amount = String(data.amount);
      await db.update(transactions).set(updateData).where(eq(transactions.id, id));
      return { success: true };
    }),

  delete: publicQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(transactions).where(eq(transactions.id, input.id));
      return { success: true };
    }),
});
