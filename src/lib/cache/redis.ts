/**
 * Redis cache implementation
 * Falls back to in-memory cache if Redis is not available
 */

import Redis from 'ioredis';

import { logInfo, logError, logWarn, logDebug } from '@/lib/logging/logger';

let redisClient: Redis | null = null;
let isRedisAvailable = false;

/**
 * Initialize Redis client
 */
export function initRedis(): void {
  const redisUrl = process.env.REDIS_URL;
  
  if (!redisUrl) {
    logWarn('Redis URL not configured, using in-memory cache');
    return;
  }

  try {
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      reconnectOnError: (err) => {
        const targetError = 'READONLY';
        if (err.message.includes(targetError)) {
          return true;
        }
        return false;
      },
    });

    redisClient.on('connect', () => {
      logInfo('✅ Redis connected');
      isRedisAvailable = true;
    });

    redisClient.on('error', (err) => {
      logError('Redis connection error:', err);
      isRedisAvailable = false;
    });

    redisClient.on('close', () => {
      logWarn('Redis connection closed');
      isRedisAvailable = false;
    });

    redisClient.on('reconnecting', () => {
      logInfo('Redis reconnecting...');
    });
  } catch (error) {
    logError('Failed to initialize Redis:', error);
    isRedisAvailable = false;
  }
}

/**
 * Get Redis client instance
 */
export function getRedisClient(): Redis | null {
  return redisClient;
}

/**
 * Check if Redis is available
 */
export function isRedisConnected(): boolean {
  return isRedisAvailable && redisClient?.status === 'ready';
}

/**
 * Close Redis connection
 */
export async function closeRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    isRedisAvailable = false;
  }
}

