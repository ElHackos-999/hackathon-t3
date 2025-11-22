import { sql } from "drizzle-orm";
import { pgEnum, pgTable } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// Enums
export const userRoleEnum = pgEnum("user_role", ["user", "admin"]);

// User table
export const User = pgTable("user", (t) => ({
  id: t.uuid().notNull().primaryKey().defaultRandom(),
  walletAddress: t.text().notNull().unique(),
  name: t.text(),
  email: t.text(),
  role: userRoleEnum().notNull().default("user"),
  createdAt: t.timestamp().defaultNow().notNull(),
  updatedAt: t
    .timestamp({ mode: "date", withTimezone: true })
    .$onUpdateFn(() => sql`now()`),
}));

export const CreateUserSchema = createInsertSchema(User, {
  walletAddress: z.string().min(1),
  name: z.string().optional(),
  email: z.email().optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
