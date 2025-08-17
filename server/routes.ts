import express, { Request, Response } from "express";
import { z } from "zod";
import { storage } from "./storage.js";
import { requireAuth, requireAdmin } from "./auth.js";
import {
  loginSchema,
  registerSchema,
  profileUpdateSchema,
  passwordChangeSchema,
  settingsSchema
} from "@shared/schema.js";
import { getVersionInfo, updateVersionInfo } from "@shared/version.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { sendEmail } from "./services/email-service.js";
import { AIService } from "./services/ai-service.js";

const app = express.Router();

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Version info
app.get("/version", (req, res) => {
  const versionInfo = getVersionInfo();
  res.json(versionInfo);
});

// Authentication routes
app.post("/auth/register", async (req: Request, res: Response) => {
  try {
    const userData = registerSchema.parse(req.body);
    
    // Check if user already exists
    const existingUser = await storage.getUserByEmail(userData.email);
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Create user
    const user = await storage.createUser(userData);
    
    // Create default settings
    await storage.createUserSettings({
      userId: user.id,
      aiProvider: "openai",
      apiKeys: {},
      theme: "system",
      preferences: {},
      notifications: {},
      customSettings: {}
    });

    // Generate verification code
    const verificationCode = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours
    
    await storage.setEmailVerification(user.id, verificationCode, expires);

    // Send verification email
    try {
      await sendEmail({
        to: user.email,
        subject: "Verify Your Email Address",
        html: `
          <h1>Welcome!</h1>
          <p>Please click the link below to verify your email address:</p>
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5000'}/verify?code=${verificationCode}&userId=${user.id}">
            Verify Email
          </a>
          <p>This link will expire in 24 hours.</p>
        `
      });
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
      // Continue registration even if email fails
    }

    // Create session
    req.session.userId = user.id;
    req.session.user = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      emailVerified: user.emailVerified
    };

    res.json({
      message: "Registration successful",
      user: req.session.user,
      needsEmailVerification: !user.emailVerified
    });
  } catch (error) {
    console.error("Registration error:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid input", details: error.errors });
    }
    res.status(500).json({ error: "Registration failed" });
  }
});

app.post("/auth/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    
    const user = await storage.verifyPassword(email, password);
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Update last login
    await storage.updateUser(user.id, {
      lastLoginAt: new Date().toISOString()
    });

    // Create session
    req.session.userId = user.id;
    req.session.user = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      emailVerified: user.emailVerified
    };

    res.json({
      message: "Login successful",
      user: req.session.user
    });
  } catch (error) {
    console.error("Login error:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid input", details: error.errors });
    }
    res.status(500).json({ error: "Login failed" });
  }
});

app.post("/auth/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Logout error:", err);
      return res.status(500).json({ error: "Logout failed" });
    }
    res.clearCookie("connect.sid");
    res.json({ message: "Logged out successfully" });
  });
});

app.get("/auth/me", requireAuth, (req, res) => {
  res.json({ user: req.session.user });
});

// Email verification
app.post("/auth/verify-email", async (req: Request, res: Response) => {
  try {
    const { userId, code } = req.body;
    
    const isValid = await storage.verifyEmailCode(userId, code);
    if (!isValid) {
      return res.status(400).json({ error: "Invalid or expired verification code" });
    }

    // Update session if it's the current user
    if (req.session.userId === userId && req.session.user) {
      req.session.user.emailVerified = true;
    }

    res.json({ message: "Email verified successfully" });
  } catch (error) {
    console.error("Email verification error:", error);
    res.status(500).json({ error: "Verification failed" });
  }
});

// User profile routes
app.get("/profile", requireAuth, async (req: Request, res: Response) => {
  try {
    const user = await storage.getUserById(req.session.userId!);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const { password, verificationCode, verificationExpires, ...userProfile } = user;
    res.json(userProfile);
  } catch (error) {
    console.error("Profile fetch error:", error);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

app.patch("/profile", requireAuth, async (req: Request, res: Response) => {
  try {
    const updates = profileUpdateSchema.parse(req.body);
    
    const updatedUser = await storage.updateUser(req.session.userId!, updates);
    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // Update session
    if (req.session.user) {
      req.session.user.firstName = updatedUser.firstName;
      req.session.user.lastName = updatedUser.lastName;
    }

    const { password, verificationCode, verificationExpires, ...userProfile } = updatedUser;
    res.json(userProfile);
  } catch (error) {
    console.error("Profile update error:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid input", details: error.errors });
    }
    res.status(500).json({ error: "Profile update failed" });
  }
});

app.post("/profile/change-password", requireAuth, async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = passwordChangeSchema.parse(req.body);
    
    const user = await storage.getUserById(req.session.userId!);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ error: "Current password is incorrect" });
    }

    // Hash new password and update
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);
    await storage.updateUser(user.id, { password: hashedNewPassword });

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Password change error:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid input", details: error.errors });
    }
    res.status(500).json({ error: "Password change failed" });
  }
});

// Settings routes
app.get("/settings", requireAuth, async (req: Request, res: Response) => {
  try {
    let settings = await storage.getUserSettings(req.session.userId!);
    
    if (!settings) {
      // Create default settings if none exist
      settings = await storage.createUserSettings({
        userId: req.session.userId!,
        aiProvider: "openai",
        apiKeys: {},
        theme: "system",
        preferences: {},
        notifications: {},
        customSettings: {}
      });
    }

    res.json(settings);
  } catch (error) {
    console.error("Settings fetch error:", error);
    res.status(500).json({ error: "Failed to fetch settings" });
  }
});

app.patch("/settings", requireAuth, async (req: Request, res: Response) => {
  try {
    const settingsUpdate = settingsSchema.parse(req.body);
    
    const updatedSettings = await storage.updateUserSettings(req.session.userId!, settingsUpdate);
    if (!updatedSettings) {
      return res.status(404).json({ error: "Settings not found" });
    }

    res.json(updatedSettings);
  } catch (error) {
    console.error("Settings update error:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid input", details: error.errors });
    }
    res.status(500).json({ error: "Settings update failed" });
  }
});

// AI Provider routes
app.get("/ai/providers", (req, res) => {
  const providers = [
    {
      id: "openai",
      name: "OpenAI",
      description: "GPT models from OpenAI",
      requiresApiKey: true,
      keyLabel: "OpenAI API Key"
    },
    {
      id: "anthropic", 
      name: "Anthropic",
      description: "Claude models from Anthropic",
      requiresApiKey: true,
      keyLabel: "Anthropic API Key"
    },
    {
      id: "openrouter",
      name: "OpenRouter",
      description: "Access to multiple models via OpenRouter",
      requiresApiKey: true,
      keyLabel: "OpenRouter API Key"
    }
  ];
  res.json(providers);
});

app.get("/ai/models/:provider", requireAuth, async (req: Request, res: Response) => {
  try {
    const { provider } = req.params;
    const userSettings = await storage.getUserSettings(req.session.userId!);
    
    if (!userSettings?.apiKeys || !userSettings.apiKeys[provider]) {
      return res.status(400).json({ error: "API key not configured for this provider" });
    }

    const aiService = new AIService();
    const models = await aiService.getAvailableModels(provider as any, userSettings.apiKeys[provider]);
    res.json({ models });
  } catch (error) {
    console.error("Models fetch error:", error);
    res.status(500).json({ error: "Failed to fetch models" });
  }
});

app.post("/ai/chat", requireAuth, async (req: Request, res: Response) => {
  try {
    const { provider, model, messages, apiKey } = req.body;
    
    if (!provider || !messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Invalid request format" });
    }

    const userSettings = await storage.getUserSettings(req.session.userId!);
    const keyToUse = apiKey || userSettings?.apiKeys?.[provider];
    
    if (!keyToUse) {
      return res.status(400).json({ error: "API key not provided" });
    }

    const aiService = new AIService();
    const response = await aiService.generateResponse(provider, {
      model: model || "default",
      messages,
      apiKey: keyToUse
    });

    res.json({ response });
  } catch (error) {
    console.error("AI chat error:", error);
    res.status(500).json({ error: "AI request failed" });
  }
});

// Admin routes
app.get("/users", requireAdmin, async (req: Request, res: Response) => {
  try {
    const users = await storage.getAllUsers();
    const safeUsers = users.map(user => {
      const { password, verificationCode, verificationExpires, ...safeUser } = user;
      return safeUser;
    });
    res.json(safeUsers);
  } catch (error) {
    console.error("Users fetch error:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

export default app;