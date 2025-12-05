/**
 * Caching utilities for API responses and database queries
 * Uses Redis if available, falls back to in-memory cache
 */

import { initRedis, isRedisConnected } from './cache/redis';
import { redisCache } from './cache/redis-cache';

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class MemoryCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private readonly defaultTTL: number = 3600 * 1000; // 1 hour in milliseconds

  /**
   * Get cached value
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set cached value
   */
  set<T>(key: string, data: T, ttlMs?: number): void {
    const ttl = ttlMs || this.defaultTTL;
    const expiresAt = Date.now() + ttl;

    this.cache.set(key, {
      data,
      expiresAt,
    });
  }

  /**
   * Delete cached value
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Delete all cached values matching a pattern
   */
  deletePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const now = Date.now();
    let expired = 0;
    let active = 0;

    for (const entry of this.cache.values()) {
      if (now > entry.expiresAt) {
        expired++;
      } else {
        active++;
      }
    }

    return {
      total: this.cache.size,
      active,
      expired,
    };
  }
}

// Singleton instances
const memoryCache = new MemoryCache();

// Initialize Redis on module load
if (typeof window === 'undefined') {
  // Only initialize on server-side
  initRedis();
}

// Clean up expired entries every 5 minutes (memory cache only)
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of memoryCache['cache'].entries()) {
    if (now > entry.expiresAt) {
      memoryCache.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Get the active cache instance (Redis if available, otherwise memory)
 */
async function getCache() {
  if (isRedisConnected()) {
    return redisCache;
  }
  return memoryCache;
}

/**
 * Cache key generators
 */
export const CacheKeys = {
  products: (filters?: string) => `products:${filters || 'all'}`,
  product: (id: number | string) => `product:${id}`,
  categories: () => 'categories:all',
  category: (id: number | string) => `category:${id}`,
  siteSettings: () => 'site:settings',
  featuredProducts: (count: number) => `products:featured:${count}`,
  relatedProducts: (productId: number) => `products:related:${productId}`,
} as const;

/**
 * Get or set cached value
 */
export async function getOrSetCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs?: number
): Promise<T> {
  const cache = await getCache();
  
  // Try to get from cache
  if (cache === redisCache) {
    const cached = await cache.get<T>(key);
    if (cached !== null) {
      return cached;
    }
  } else {
    const cached = cache.get<T>(key);
    if (cached !== null) {
      return cached;
    }
  }

  // Fetch fresh data
  const data = await fetcher();
  
  // Cache it
  if (cache === redisCache) {
    await cache.set(key, data, ttlMs);
  } else {
    cache.set(key, data, ttlMs);
  }
  
  return data;
}

/**
 * Invalidate cache by key or pattern
 */
export async function invalidateCache(keyOrPattern: string): Promise<void> {
  const cache = await getCache();
  
  if (keyOrPattern.includes('*') || keyOrPattern.includes('^')) {
    if (cache === redisCache) {
      await cache.deletePattern(keyOrPattern);
    } else {
      cache.deletePattern(keyOrPattern);
    }
  } else {
    if (cache === redisCache) {
      await cache.delete(keyOrPattern);
    } else {
      cache.delete(keyOrPattern);
    }
  }
}

/**
 * Invalidate all product-related cache
 */
export async function invalidateProductCache(productId?: number): Promise<void> {
  const cache = await getCache();
  
  if (productId) {
    if (cache === redisCache) {
      await cache.delete(CacheKeys.product(productId));
      await cache.delete(CacheKeys.relatedProducts(productId));
    } else {
      cache.delete(CacheKeys.product(productId));
      cache.delete(CacheKeys.relatedProducts(productId));
    }
  }
  
  if (cache === redisCache) {
    await cache.deletePattern('^products:');
  } else {
    cache.deletePattern('^products:');
  }
}

/**
 * Invalidate all category-related cache
 */
export async function invalidateCategoryCache(): Promise<void> {
  const cache = await getCache();
  
  if (cache === redisCache) {
    await cache.deletePattern('^category');
    await cache.delete(CacheKeys.categories());
  } else {
    cache.deletePattern('^category');
    cache.delete(CacheKeys.categories());
  }
}

/**
 * Get cache instance (for advanced usage)
 * Returns the active cache (Redis if available, otherwise memory)
 */
export async function getCacheInstance() {
  return await getCache();
}

/**
 * Get cache statistics
 */
export async function getCacheStats() {
  const cache = await getCache();
  
  if (cache === redisCache) {
    const stats = cache.getStats();
    return {
      ...stats,
      type: 'redis',
    };
  } else {
    const stats = cache.getStats();
    return {
      ...stats,
      type: 'memory',
      hitRate: 0, // Memory cache doesn't track hit rate
    };
  }
}

