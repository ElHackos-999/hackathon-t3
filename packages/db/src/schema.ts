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

// Course table
export const Course = pgTable("course", (t) => ({
  id: t.uuid().notNull().primaryKey().defaultRandom(),
  name: t.text().notNull(),
  description: t.text().notNull(),
  courseCode: t.text().notNull().unique(),
  imageUrl: t.text().notNull(),
  cost: t.numeric({ precision: 10, scale: 2 }).notNull(),
  avgCompletionMinutes: t.integer().notNull(),
  validityMonths: t.integer().notNull(),
  tags: t.text().array().notNull(),
  tokenId: t.integer().notNull().unique(),
  createdAt: t.timestamp().defaultNow().notNull(),
}));

export const CreateCourseSchema = createInsertSchema(Course, {
  name: z.string().min(1),
  description: z.string().min(1),
  courseCode: z.string().min(1),
  imageUrl: z.string().min(1),
  cost: z.string(),
  avgCompletionMinutes: z.number().int().positive(),
  validityMonths: z.number().int().positive(),
  tags: z.array(z.string()),
  tokenId: z.number().int().positive(),
}).omit({
  id: true,
  createdAt: true,
});
