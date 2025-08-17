import bcrypt from "bcrypt";
import { storage } from "./storage";
import type { Request, Response, NextFunction } from "express";

const SALT_ROUNDS = 10;

declare module 'express-session' {
  interface SessionData {
    userId?: string;
  }
}

export interface AuthenticatedRequest extends Request {
  userId?: string;
  session: any;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  console.log('RequireAuth - checking session:', {
    hasSession: !!req.session,
    sessionID: req.sessionID,
    userId: req.session?.userId,
    path: req.path
  });
  
  if (!req.session || !req.session.userId) {
    console.log('RequireAuth - FAILED: No session or userId');
    return res.status(401).json({ error: "Authentication required" });
  }
  
  req.userId = req.session.userId;
  console.log('RequireAuth - SUCCESS: User authenticated:', req.userId);
  next();
}

export async function getCurrentUser(userId: string) {
  const user = await storage.getUser(userId);
  if (!user) {
    return null;
  }
  
  // Remove sensitive fields from response
  const { password, verificationCode, ...userWithoutSensitiveData } = user;
  return userWithoutSensitiveData;
}

export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function isCodeExpired(expiresAt: string): boolean {
  return new Date() > new Date(expiresAt);
}

// Role-based access control middleware
export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  requireAuth(req, res, async () => {
    try {
      const user = await storage.getUser(req.userId!);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ error: "Admin access required" });
      }
      next();
    } catch (error) {
      console.error('Admin check error:', error);
      return res.status(500).json({ error: "Authorization check failed" });
    }
  });
}

// Update last login time
export async function updateLastLogin(userId: string): Promise<void> {
  try {
    await storage.updateUser(userId, { 
      lastLoginAt: new Date().toISOString() 
    });
  } catch (error) {
    console.error('Failed to update last login:', error);
    // Don't fail the login process if this fails
  }
}