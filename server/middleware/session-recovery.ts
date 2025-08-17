import { Request, Response, NextFunction } from 'express';

export interface SessionHealthCheck {
  userId: string;
  lastActive: string;
  sessionId: string;
  userAgent: string;
}

const activeSessions = new Map<string, SessionHealthCheck>();

export function sessionHealthMiddleware(req: Request, res: Response, next: NextFunction) {
  // Track healthy sessions
  if (req.session && (req as any).userId) {
    const userId = (req as any).userId;
    const sessionId = req.session.id || 'unknown';
    
    activeSessions.set(sessionId, {
      userId,
      lastActive: new Date().toISOString(),
      sessionId,
      userAgent: req.get('User-Agent') || 'unknown'
    });
  }

  // Add session recovery headers
  res.setHeader('X-Session-Recovery', 'enabled');
  res.setHeader('X-Auth-Fallback', 'supported');

  // Override auth errors with recovery instructions
  const originalStatus = res.status;
  res.status = function(statusCode: number) {
    if (statusCode === 401 && req.path.startsWith('/api/')) {
      // Add recovery hints to 401 responses
      this.setHeader('X-Recovery-Hint', 'session-expired');
      this.setHeader('X-Fallback-Action', 'relogin-required');
    }
    return originalStatus.call(this, statusCode);
  };

  next();
}

export function getActiveSessionsCount(): number {
  return activeSessions.size;
}

export function cleanupExpiredSessions(): void {
  const now = Date.now();
  const expiredThreshold = 30 * 60 * 1000; // 30 minutes

  for (const [sessionId, session] of Array.from(activeSessions.entries())) {
    const lastActive = new Date(session.lastActive).getTime();
    if (now - lastActive > expiredThreshold) {
      activeSessions.delete(sessionId);
      console.log(`Cleaned up expired session ${sessionId} for user ${session.userId}`);
    }
  }
}

// Run cleanup every 10 minutes
setInterval(cleanupExpiredSessions, 10 * 60 * 1000);