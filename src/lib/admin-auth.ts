import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

// In-memory session store (use Redis in production)
const sessions = new Map<string, { expiry: number; createdAt: number }>();

// Rate limiting store
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

/**
 * Get admin password from environment - NO DEFAULT
 */
export function getAdminPassword(): string | null {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    console.error('ADMIN_PASSWORD environment variable is not set!');
    return null;
  }
  if (password.length < 8) {
    console.error('ADMIN_PASSWORD must be at least 8 characters!');
    return null;
  }
  return password;
}

/**
 * Check rate limiting for login attempts
 */
export function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const attempts = loginAttempts.get(ip);

  if (attempts) {
    // Reset if lockout period has passed
    if (now > attempts.resetAt) {
      loginAttempts.delete(ip);
      return { allowed: true };
    }

    if (attempts.count >= MAX_LOGIN_ATTEMPTS) {
      const retryAfter = Math.ceil((attempts.resetAt - now) / 1000);
      return { allowed: false, retryAfter };
    }
  }

  return { allowed: true };
}

/**
 * Record a failed login attempt
 */
export function recordFailedAttempt(ip: string): void {
  const now = Date.now();
  const attempts = loginAttempts.get(ip);

  if (attempts && now < attempts.resetAt) {
    attempts.count += 1;
  } else {
    loginAttempts.set(ip, {
      count: 1,
      resetAt: now + LOGIN_LOCKOUT_DURATION,
    });
  }
}

/**
 * Clear login attempts on successful login
 */
export function clearLoginAttempts(ip: string): void {
  loginAttempts.delete(ip);
}

/**
 * Create a new admin session
 */
export function createSession(): { token: string; expiry: number } {
  const token = uuidv4();
  const expiry = Date.now() + SESSION_DURATION;

  sessions.set(token, {
    expiry,
    createdAt: Date.now(),
  });

  // Cleanup old sessions
  cleanupSessions();

  return { token, expiry };
}

/**
 * Verify an admin session token
 */
export function verifySession(token: string | null): boolean {
  if (!token) return false;

  const session = sessions.get(token);
  if (!session) return false;

  if (Date.now() > session.expiry) {
    sessions.delete(token);
    return false;
  }

  return true;
}

/**
 * Invalidate a session (logout)
 */
export function invalidateSession(token: string): void {
  sessions.delete(token);
}

/**
 * Cleanup expired sessions
 */
function cleanupSessions(): void {
  const now = Date.now();
  sessions.forEach((session, token) => {
    if (now > session.expiry) {
      sessions.delete(token);
    }
  });
}

/**
 * Extract session token from request
 */
export function getSessionToken(request: NextRequest): string | null {
  // Check Authorization header first
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  // Fall back to cookie
  const cookie = request.cookies.get('admin_session');
  return cookie?.value || null;
}

/**
 * Middleware helper to verify admin authentication
 * Returns null if authenticated, or an error response if not
 */
export function requireAdminAuth(request: NextRequest): NextResponse | null {
  const token = getSessionToken(request);

  if (!verifySession(token)) {
    return NextResponse.json(
      { error: 'Unauthorized. Please log in.' },
      { status: 401 }
    );
  }

  return null; // Authenticated
}

/**
 * Get client IP from request
 */
export function getClientIP(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}
