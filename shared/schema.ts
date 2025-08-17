import { sql } from "drizzle-orm";
import { pgTable, text, varchar, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  password: text("password").notNull(),
  role: text("role").notNull().default("user"),
  emailVerified: boolean("email_verified").default(false),
  verificationCode: text("verification_code"),
  verificationExpires: text("verification_expires"),
  lastLoginAt: text("last_login_at"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const userSettings = pgTable("user_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  aiProvider: text("ai_provider").notNull().default("openai"),
  apiKeys: jsonb("api_keys").default({}),
  theme: text("theme").default("system"),
  preferences: jsonb("preferences").default({}), // General app preferences
  notifications: jsonb("notifications").default({}), // Notification settings
  customSettings: jsonb("custom_settings").default({}), // App-specific settings
});

// Zod schemas for API validation
export const insertUserSchema = createInsertSchema(users, {
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
});

export const insertUserSettingsSchema = createInsertSchema(userSettings);

export const settingsSchema = z.object({
  aiProvider: z.enum(["openai", "anthropic", "openrouter"]).optional(),
  apiKeys: z.record(z.string()).optional(),
  theme: z.enum(["light", "dark", "system"]).optional(),
  preferences: z.record(z.any()).optional(),
  notifications: z.record(z.any()).optional(),
  customSettings: z.record(z.any()).optional(),
});

// Base auth schemas
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
});

export const profileUpdateSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
});

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

// Types for TypeScript
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UserSettings = typeof userSettings.$inferSelect;
export type InsertUserSettings = z.infer<typeof insertUserSettingsSchema>;