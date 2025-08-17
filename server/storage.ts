import { eq, and } from "drizzle-orm";
import { db } from "./db.js";
import { users, userSettings, type User, type UserSettings, type InsertUser, type InsertUserSettings } from "@shared/schema.js";
import bcrypt from "bcrypt";

export interface IStorage {
  // User operations
  createUser(user: InsertUser): Promise<User>;
  getUserById(id: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  updateUser(id: string, updates: Partial<User>): Promise<User | null>;
  deleteUser(id: string): Promise<boolean>;
  getAllUsers(): Promise<User[]>;

  // User settings operations
  getUserSettings(userId: string): Promise<UserSettings | null>;
  updateUserSettings(userId: string, settings: Partial<UserSettings>): Promise<UserSettings | null>;
  createUserSettings(settings: InsertUserSettings): Promise<UserSettings>;

  // Authentication helpers
  verifyPassword(email: string, password: string): Promise<User | null>;
  setEmailVerification(userId: string, code: string, expires: string): Promise<boolean>;
  verifyEmailCode(userId: string, code: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async createUser(user: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(user.password, 12);
    const [newUser] = await db
      .insert(users)
      .values({ ...user, password: hashedPassword })
      .returning();
    return newUser;
  }

  async getUserById(id: string): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || null;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    const [updatedUser] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return updatedUser || null;
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getUserSettings(userId: string): Promise<UserSettings | null> {
    const [settings] = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, userId));
    return settings || null;
  }

  async updateUserSettings(userId: string, settings: Partial<UserSettings>): Promise<UserSettings | null> {
    const [updatedSettings] = await db
      .update(userSettings)
      .set(settings)
      .where(eq(userSettings.userId, userId))
      .returning();
    return updatedSettings || null;
  }

  async createUserSettings(settings: InsertUserSettings): Promise<UserSettings> {
    const [newSettings] = await db
      .insert(userSettings)
      .values(settings)
      .returning();
    return newSettings;
  }

  async verifyPassword(email: string, password: string): Promise<User | null> {
    const user = await this.getUserByEmail(email);
    if (!user) return null;

    const isValid = await bcrypt.compare(password, user.password);
    return isValid ? user : null;
  }

  async setEmailVerification(userId: string, code: string, expires: string): Promise<boolean> {
    const result = await db
      .update(users)
      .set({ 
        verificationCode: code,
        verificationExpires: expires
      })
      .where(eq(users.id, userId));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async verifyEmailCode(userId: string, code: string): Promise<boolean> {
    const [user] = await db
      .select()
      .from(users)
      .where(and(
        eq(users.id, userId),
        eq(users.verificationCode, code)
      ));

    if (!user || !user.verificationExpires) return false;

    const now = new Date();
    const expires = new Date(user.verificationExpires);
    
    if (now > expires) return false;

    // Mark as verified and clear verification data
    await db
      .update(users)
      .set({
        emailVerified: true,
        verificationCode: null,
        verificationExpires: null
      })
      .where(eq(users.id, userId));

    return true;
  }
}

export const storage = new DatabaseStorage();