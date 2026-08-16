import { z } from "zod";
import { eq } from "drizzle-orm";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { skillCategories, skills } from "@db/schema";

export const skillRouter = createRouter({
  listCategories: publicQuery.query(async () => {
    const db = getDb();
    return db.query.skillCategories.findMany({
      orderBy: [skillCategories.sortOrder],
      with: {
        skills: true,
      },
    });
  }),

  list: publicQuery.query(async () => {
    const db = getDb();
    return db.query.skills.findMany({
      with: {
        category: true,
      },
    });
  }),

  create: publicQuery
    .input(
      z.object({
        categoryId: z.number(),
        nameEn: z.string().min(1),
        nameId: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const [skill] = await db.insert(skills).values(input).$returningId();
      return { id: skill.id };
    }),

  update: publicQuery
    .input(
      z.object({
        id: z.number(),
        nameEn: z.string().min(1).optional(),
        nameId: z.string().min(1).optional(),
        categoryId: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ...data } = input;
      await db.update(skills).set(data).where(eq(skills.id, id));
      return { success: true };
    }),
});
