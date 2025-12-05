/**
 * Caching utilities for API responses and database queries
 * Uses in-memory cache (can be upgraded to Redis for production)
 */

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

// Singleton instance
const cache = new MemoryCache();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of cache['cache'].entries()) {
    if (now > entry.expiresAt) {
      cache.delete(key);
    }
  }
}, 5 * 60 * 1000);

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
  // Try to get from cache
  const cached = cache.get<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Fetch fresh data
  const data = await fetcher();
  
  // Cache it
  cache.set(key, data, ttlMs);
  
  return data;
}

/**
 * Invalidate cache by key or pattern
 */
export function invalidateCache(keyOrPattern: string): void {
  if (keyOrPattern.includes('*') || keyOrPattern.includes('^')) {
    cache.deletePattern(keyOrPattern);
  } else {
    cache.delete(keyOrPattern);
  }
}

/**
 * Invalidate all product-related cache
 */
export function invalidateProductCache(productId?: number): void {
  if (productId) {
    cache.delete(CacheKeys.product(productId));
    cache.delete(CacheKeys.relatedProducts(productId));
  }
  cache.deletePattern('^products:');
}

/**
 * Invalidate all category-related cache
 */
export function invalidateCategoryCache(): void {
  cache.deletePattern('^category');
  cache.delete(CacheKeys.categories());
}

/**
 * Get cache instance (for advanced usage)
 */
export function getCache() {
  return cache;
}

