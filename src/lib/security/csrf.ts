/**
 * CSRF Protection Utilities
 * Implements Double Submit Cookie pattern for CSRF protection
 */

import { cookies } from 'next/headers';
import crypto from 'crypto';

const CSRF_TOKEN_COOKIE = 'csrf-token';
const CSRF_TOKEN_HEADER = 'X-CSRF-Token';
const CSRF_TOKEN_LENGTH = 32;

/**
 * Generate a new CSRF token
 */
export function generateCsrfToken(): string {
  return crypto.randomBytes(CSRF_TOKEN_LENGTH).toString('hex');
}

/**
 * Get CSRF token from request cookies
 */
export function getCsrfTokenFromRequest(request: NextRequest): string | null {
  return request.cookies.get(CSRF_TOKEN_COOKIE)?.value || null;
}

/**
 * Verify CSRF token from request
 */
export function verifyCsrfToken(request: NextRequest): boolean {
  const cookieToken = request.cookies.get(CSRF_TOKEN_COOKIE)?.value;
  const headerToken = request.headers.get(CSRF_TOKEN_HEADER);

  if (!cookieToken || !headerToken) {
    return false;
  }

  // Compare tokens using constant-time comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(cookieToken),
      Buffer.from(headerToken)
    );
  } catch {
    // If buffers are different lengths, timingSafeEqual throws
    return false;
  }
}

/**
 * Middleware to verify CSRF token for API routes
 */
export function requireCsrfToken(request: NextRequest): Response | null {
  // Skip CSRF check for GET, HEAD, OPTIONS requests
  const method = request.method;
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    return null;
  }

  // Skip CSRF check for webhooks (they use signature verification instead)
  const url = new URL(request.url);
  if (url.pathname.startsWith('/api/webhooks/')) {
    return null;
  }

  // Skip CSRF check for public endpoints that don't modify state
  if (url.pathname.startsWith('/api/csrf-token')) {
    return null;
  }

  const isValid = verifyCsrfToken(request);

  if (!isValid) {
    return new Response(
      JSON.stringify({ error: 'Invalid CSRF token' }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  return null;
}

