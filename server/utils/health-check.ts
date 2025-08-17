import { db } from '../db';
import { users, userSettings } from '../../shared/schema';

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: {
    database: boolean;
    userSettings: boolean;
    authentication: boolean;
    criticalServices: boolean;
  };
  timestamp: string;
  details: string[];
}

export async function performHealthCheck(): Promise<HealthCheckResult> {
  const result: HealthCheckResult = {
    status: 'healthy',
    checks: {
      database: false,
      userSettings: false,
      authentication: false,
      criticalServices: false
    },
    timestamp: new Date().toISOString(),
    details: []
  };

  try {
    // Test database connectivity using drizzle
    await db.select().from(users).limit(1);
    result.checks.database = true;
    result.details.push('Database connection: OK');
  } catch (error) {
    result.checks.database = false;
    result.details.push(`Database connection: FAILED - ${error}`);
    result.status = 'unhealthy';
  }

  try {
    // Test user settings table structure
    await db.select().from(userSettings).limit(1);
    result.checks.userSettings = true;
    result.details.push('User settings table: OK');
  } catch (error) {
    result.checks.userSettings = false;
    result.details.push(`User settings table: FAILED - ${error}`);
    result.status = 'unhealthy';
  }

  try {
    // Test authentication table structure  
    const userCount = await db.select().from(users).limit(1);
    result.checks.authentication = true;
    result.details.push('Authentication system: OK');
  } catch (error) {
    result.checks.authentication = false;
    result.details.push(`Authentication system: FAILED - ${error}`);
    result.status = 'unhealthy';
  }

  // Check if any critical checks failed
  const criticalChecks = [result.checks.database, result.checks.userSettings, result.checks.authentication];
  result.checks.criticalServices = criticalChecks.every(check => check);

  if (!result.checks.criticalServices && result.status === 'healthy') {
    result.status = 'degraded';
  }

  return result;
}

export async function runPeriodicHealthCheck(): Promise<void> {
  try {
    const health = await performHealthCheck();
    console.log(`Health check: ${health.status} - ${health.details.join(', ')}`);
    
    if (health.status === 'unhealthy') {
      console.error('CRITICAL: Application health check failed!', health);
    }
  } catch (error) {
    console.error('Health check failed to run:', error);
  }
}

// Run health check every 5 minutes
setInterval(runPeriodicHealthCheck, 5 * 60 * 1000);