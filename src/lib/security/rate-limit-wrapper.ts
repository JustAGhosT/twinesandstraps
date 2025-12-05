/**
 * Rate limiting wrapper for API routes
 * Provides consistent rate limiting across all endpoints
 */

import { NextRequest, NextResponse } from 'next/server';
import { getClientIdentifier, checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

export interface RateLimitConfig {
  maxRequests?: number;
  windowMs?: number;
  keyPrefix?: string;
}

/**
 * Default rate limit configuration
 */
const DEFAULT_RATE_LIMIT: RateLimitConfig = {
  maxRequests: 100,
  windowMs: 15 * 60 * 1000, // 15 minutes
};

/**
 * Rate limit middleware wrapper
 * Use this to wrap API route handlers
 */
export function withRateLimit(
  handler: (request: NextRequest, ...args: any[]) => Promise<Response>,
  config: RateLimitConfig = {}
) {
  return async (request: NextRequest, ...args: any[]): Promise<Response> => {
    const clientId = getClientIdentifier(request);
    const keyPrefix = config.keyPrefix || 'api';
    const rateLimitKey = `${keyPrefix}:${clientId}`;

    const maxRequests = config.maxRequests || DEFAULT_RATE_LIMIT.maxRequests!;
    const windowMs = config.windowMs || DEFAULT_RATE_LIMIT.windowMs!;

    const rateLimit = checkRateLimit(rateLimitKey, maxRequests, windowMs);

    if (!rateLimit.allowed) {
      const retryAfter = Math.ceil((rateLimit.resetAt - Date.now()) / 1000);
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(rateLimit.resetAt).toISOString(),
          },
        }
      );
    }

    // Add rate limit headers to response
    const response = await handler(request, ...args);
    const headers = new Headers(response.headers);
    headers.set('X-RateLimit-Limit', maxRequests.toString());
    headers.set('X-RateLimit-Remaining', rateLimit.remaining.toString());
    headers.set('X-RateLimit-Reset', new Date(rateLimit.resetAt).toISOString());

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  };
}

/**
 * Get rate limit config for specific endpoint types
 */
export function getRateLimitConfig(endpointType: 'public' | 'admin' | 'auth' | 'webhook'): RateLimitConfig {
  switch (endpointType) {
    case 'public':
      return {
        maxRequests: 100,
        windowMs: 15 * 60 * 1000, // 15 minutes
        keyPrefix: 'api:public',
      };
    case 'admin':
      return {
        maxRequests: 200,
        windowMs: 15 * 60 * 1000, // 15 minutes
        keyPrefix: 'api:admin',
      };
    case 'auth':
      return {
        maxRequests: 10,
        windowMs: 15 * 60 * 1000, // 15 minutes - stricter for auth
        keyPrefix: 'api:auth',
      };
    case 'webhook':
      return RATE_LIMITS.paymentWebhook; // Use existing webhook limits
    default:
      return DEFAULT_RATE_LIMIT;
  }
}

