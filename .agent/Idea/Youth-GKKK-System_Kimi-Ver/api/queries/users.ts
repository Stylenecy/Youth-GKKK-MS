import { eq } from "drizzle-orm";
import * as schema from "@db/schema";
import type { InsertMember } from "@db/schema";
import { getDb } from "./connection";
import { env } from "../lib/env";

export async function findUserByUnionId(unionId: string) {
  const rows = await getDb()
    .select()
    .from(schema.members)
    .where(eq(schema.members.whatsapp, unionId))
    .limit(1);
  return rows.at(0);
}

export async function upsertUser(data: InsertMember) {
  const values = { ...data };
  const updateSet: Partial<InsertMember> = {
    updatedAt: new Date(),
    ...data,
  };

  if (
    values.role === undefined &&
    values.whatsapp &&
    values.whatsapp === env.ownerUnionId
  ) {
    values.role = "super_admin";
    updateSet.role = "super_admin";
  }

  await getDb()
    .insert(schema.members)
    .values(values)
    .onDuplicateKeyUpdate({ set: updateSet });
}
