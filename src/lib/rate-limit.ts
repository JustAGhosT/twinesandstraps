/**
 * Simple in-memory rate limiting for API endpoints
 * For production, consider using Redis or a dedicated rate limiting service
 */

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetAt: number;
  };
}

const store: RateLimitStore = {};

/**
 * Clean up expired entries periodically
 */
setInterval(() => {
  const now = Date.now();
  Object.keys(store).forEach((key) => {
    if (store[key].resetAt < now) {
      delete store[key];
    }
  });
}, 60000); // Clean up every minute

/**
 * Check if a request should be rate limited
 * @param identifier - Unique identifier (e.g., IP address, user ID)
 * @param maxRequests - Maximum number of requests allowed
 * @param windowMs - Time window in milliseconds
 * @returns true if request should be allowed, false if rate limited
 */
export function checkRateLimit(
  identifier: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const key = identifier;
  
  if (!store[key] || store[key].resetAt < now) {
    // Create new window
    store[key] = {
      count: 1,
      resetAt: now + windowMs,
    };
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetAt: store[key].resetAt,
    };
  }
  
  // Increment count
  store[key].count += 1;
  
  if (store[key].count > maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: store[key].resetAt,
    };
  }
  
  return {
    allowed: true,
    remaining: maxRequests - store[key].count,
    resetAt: store[key].resetAt,
  };
}

/**
 * Get client identifier from request
 */
export function getClientIdentifier(request: Request): string {
  // Try to get IP from various headers (for proxies/load balancers)
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  
  const ip = forwarded?.split(',')[0] || realIp || cfConnectingIp || 'unknown';
  return ip.trim();
}

/**
 * Rate limit configuration for different endpoints
 */
export const RATE_LIMITS = {
  // Payment webhook - very strict
  paymentWebhook: {
    maxRequests: 10,
    windowMs: 60 * 1000, // 1 minute
  },
  // General API endpoints
  api: {
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 minute
  },
  // Newsletter signup
  newsletter: {
    maxRequests: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
} as const;

