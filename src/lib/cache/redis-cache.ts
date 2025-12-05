/**
 * Redis-based cache implementation
 */

import { getRedisClient, isRedisConnected } from './redis';

interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
}

class RedisCache {
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
  };

  /**
   * Get cached value from Redis
   */
  async get<T>(key: string): Promise<T | null> {
    if (!isRedisConnected()) {
      return null;
    }

    const client = getRedisClient();
    if (!client) {
      return null;
    }

    try {
      const data = await client.get(key);
      if (data === null) {
        this.stats.misses++;
        return null;
      }

      this.stats.hits++;
      return JSON.parse(data) as T;
    } catch (error) {
      console.error('Redis get error:', error);
      this.stats.misses++;
      return null;
    }
  }

  /**
   * Set cached value in Redis
   */
  async set<T>(key: string, data: T, ttlMs?: number): Promise<boolean> {
    if (!isRedisConnected()) {
      return false;
    }

    const client = getRedisClient();
    if (!client) {
      return false;
    }

    try {
      const serialized = JSON.stringify(data);
      const ttlSeconds = ttlMs ? Math.ceil(ttlMs / 1000) : 3600; // Default 1 hour

      if (ttlSeconds > 0) {
        await client.setex(key, ttlSeconds, serialized);
      } else {
        await client.set(key, serialized);
      }

      this.stats.sets++;
      return true;
    } catch (error) {
      console.error('Redis set error:', error);
      return false;
    }
  }

  /**
   * Delete cached value from Redis
   */
  async delete(key: string): Promise<boolean> {
    if (!isRedisConnected()) {
      return false;
    }

    const client = getRedisClient();
    if (!client) {
      return false;
    }

    try {
      await client.del(key);
      this.stats.deletes++;
      return true;
    } catch (error) {
      console.error('Redis delete error:', error);
      return false;
    }
  }

  /**
   * Delete all cached values matching a pattern
   */
  async deletePattern(pattern: string): Promise<number> {
    if (!isRedisConnected()) {
      return 0;
    }

    const client = getRedisClient();
    if (!client) {
      return 0;
    }

    try {
      // Convert regex pattern to Redis pattern
      let redisPattern = pattern
        .replace(/^\^/, '') // Remove start anchor
        .replace(/\$$/, '') // Remove end anchor
        .replace(/\./g, '?') // Replace . with ?
        .replace(/\*/g, '*'); // Keep * as is

      const keys: string[] = [];
      let cursor = '0';

      do {
        const result = await client.scan(
          cursor,
          'MATCH',
          redisPattern,
          'COUNT',
          100
        );
        cursor = result[0];
        keys.push(...result[1]);
      } while (cursor !== '0');

      if (keys.length > 0) {
        await client.del(...keys);
        this.stats.deletes += keys.length;
      }

      return keys.length;
    } catch (error) {
      console.error('Redis deletePattern error:', error);
      return 0;
    }
  }

  /**
   * Clear all cache (use with caution!)
   */
  async clear(): Promise<boolean> {
    if (!isRedisConnected()) {
      return false;
    }

    const client = getRedisClient();
    if (!client) {
      return false;
    }

    try {
      await client.flushdb();
      return true;
    } catch (error) {
      console.error('Redis clear error:', error);
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats & { hitRate: number } {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;

    return {
      ...this.stats,
      hitRate: Math.round(hitRate * 100) / 100,
    };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
    };
  }
}

export const redisCache = new RedisCache();

