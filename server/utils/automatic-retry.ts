import { storage } from '../storage';

export interface RetryConfig {
  maxAttempts: number;
  delayMs: number;
  backoffMultiplier: number;
}

export async function retryOperation<T>(
  operation: () => Promise<T>,
  config: RetryConfig = {
    maxAttempts: 3,
    delayMs: 1000,
    backoffMultiplier: 2
  },
  operationName = 'operation'
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      const result = await operation();
      if (attempt > 1) {
        console.log(`${operationName} succeeded on attempt ${attempt}`);
      }
      return result;
    } catch (error) {
      lastError = error as Error;
      console.warn(`${operationName} failed on attempt ${attempt}/${config.maxAttempts}:`, error);
      
      if (attempt < config.maxAttempts) {
        const delay = config.delayMs * Math.pow(config.backoffMultiplier, attempt - 1);
        console.log(`Retrying ${operationName} in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  console.error(`${operationName} failed after ${config.maxAttempts} attempts`);
  throw lastError;
}

export async function withSettingsRetry<T>(
  userId: string,
  operation: () => Promise<T>,
  operationName = 'settings operation'
): Promise<T> {
  return retryOperation(
    operation,
    {
      maxAttempts: 3,
      delayMs: 500,
      backoffMultiplier: 1.5
    },
    `${operationName} for user ${userId}`
  );
}

export async function withAuthRetry<T>(
  operation: () => Promise<T>,
  operationName = 'auth operation'
): Promise<T> {
  return retryOperation(
    operation,
    {
      maxAttempts: 2,
      delayMs: 1000,
      backoffMultiplier: 2
    },
    operationName
  );
}