import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import prisma from '@/lib/prisma';

import { logInfo, logError, logWarn, logDebug } from '@/lib/logging/logger';

// Rate limiting store (kept in memory - acceptable for short-term rate limiting)
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
    logError('ADMIN_PASSWORD environment variable is not set!');
    return null;
  }
  if (password.length < 8) {
    logError('ADMIN_PASSWORD must be at least 8 characters!');
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
 * Create a new admin session in the database
 */
export async function createSession(): Promise<{ token: string; expiry: number }> {
  const token = uuidv4();
  const expiryDate = new Date(Date.now() + SESSION_DURATION);

  await prisma.adminSession.create({
    data: {
      token,
      expires_at: expiryDate,
    },
  });

  // Cleanup old sessions periodically (non-blocking)
  cleanupSessions().catch(console.error);

  return { token, expiry: expiryDate.getTime() };
}

/**
 * Verify an admin session token against the database
 */
export async function verifySession(token: string | null): Promise<boolean> {
  if (!token) return false;

  try {
    const session = await prisma.adminSession.findUnique({
      where: { token },
    });

    if (!session) return false;

    if (new Date() > session.expires_at) {
      // Delete expired session
      await prisma.adminSession.delete({ where: { token } }).catch(() => {});
      return false;
    }

    return true;
  } catch (error) {
    logError('Error verifying session:', error);
    return false;
  }
}

/**
 * Invalidate a session (logout) - removes from database
 */
export async function invalidateSession(token: string): Promise<void> {
  try {
    await prisma.adminSession.delete({ where: { token } });
  } catch (error) {
    // Session may not exist, which is fine
    logError('Error invalidating session:', error);
  }
}

/**
 * Cleanup expired sessions from the database
 */
async function cleanupSessions(): Promise<void> {
  try {
    await prisma.adminSession.deleteMany({
      where: {
        expires_at: {
          lt: new Date(),
        },
      },
    });
  } catch (error) {
    logError('Error cleaning up sessions:', error);
  }
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
 * Middleware helper to verify admin authentication (async)
 * Returns null if authenticated, or an error response if not
 */
export async function requireAdminAuth(request: NextRequest): Promise<NextResponse | null> {
  const token = getSessionToken(request);

  const isValid = await verifySession(token);
  if (!isValid) {
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
