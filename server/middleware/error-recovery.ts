import { Request, Response, NextFunction } from 'express';
import { storage } from '../storage';

export interface BackupSettings {
  userId: string;
  timestamp: string;
  settings: any;
}

// In-memory backup storage (in production, use Redis or database table)
const settingsBackups = new Map<string, BackupSettings[]>();

export async function createSettingsBackup(userId: string, settings: any): Promise<void> {
  try {
    const backup: BackupSettings = {
      userId,
      timestamp: new Date().toISOString(),
      settings: JSON.parse(JSON.stringify(settings)) // Deep clone
    };

    if (!settingsBackups.has(userId)) {
      settingsBackups.set(userId, []);
    }

    const userBackups = settingsBackups.get(userId)!;
    userBackups.push(backup);

    // Keep only last 5 backups per user
    if (userBackups.length > 5) {
      userBackups.shift();
    }

    console.log(`Settings backup created for user ${userId}`);
  } catch (error) {
    console.error(`Failed to create settings backup for user ${userId}:`, error);
  }
}

export async function restoreLatestSettingsBackup(userId: string): Promise<any | null> {
  try {
    const userBackups = settingsBackups.get(userId);
    if (!userBackups || userBackups.length === 0) {
      console.log(`No settings backups found for user ${userId}`);
      return null;
    }

    const latestBackup = userBackups[userBackups.length - 1];
    console.log(`Restoring settings backup for user ${userId} from ${latestBackup.timestamp}`);
    
    return latestBackup.settings;
  } catch (error) {
    console.error(`Failed to restore settings backup for user ${userId}:`, error);
    return null;
  }
}

export function settingsRecoveryMiddleware(req: Request, res: Response, next: NextFunction) {
  const originalJson = res.json;
  
  res.json = function(body: any) {
    // If this is a settings API error, attempt recovery
    if (req.path === '/api/settings' && res.statusCode >= 400) {
      const userId = (req as any).userId;
      if (userId) {
        console.log(`Settings API error detected for user ${userId}, attempting recovery...`);
        
        // Attempt to restore from backup in the background
        restoreLatestSettingsBackup(userId).then(async (backup) => {
          if (backup) {
            try {
              await storage.upsertUserSettings(userId, backup);
              console.log(`Successfully restored settings backup for user ${userId}`);
            } catch (error) {
              console.error(`Failed to restore settings backup for user ${userId}:`, error);
            }
          }
        });
      }
    }
    
    return originalJson.call(this, body);
  };
  
  next();
}