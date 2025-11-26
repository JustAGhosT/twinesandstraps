import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

// In-memory session store (use Redis in production)
const sessions = new Map<string, {
  userId: number;
  email: string;
  name: string;
  role: string;
  expiry: number;
  createdAt: number;
}>();

const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Hash a password using PBKDF2
 * (Using built-in crypto to avoid dependency issues with bcrypt on edge)
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Verify a password against a hash
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, hash] = storedHash.split(':');
  if (!salt || !hash) return false;
  const verifyHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return hash === verifyHash;
}

/**
 * Create a new user session
 */
export function createUserSession(user: {
  id: number;
  email: string;
  name: string;
  role: string;
}): { token: string; expiry: number } {
  const token = uuidv4();
  const expiry = Date.now() + SESSION_DURATION;

  sessions.set(token, {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    expiry,
    createdAt: Date.now(),
  });

  // Cleanup old sessions
  cleanupSessions();

  return { token, expiry };
}

/**
 * Get session data from token
 */
export function getSession(token: string | null): {
  userId: number;
  email: string;
  name: string;
  role: string;
} | null {
  if (!token) return null;

  const session = sessions.get(token);
  if (!session) return null;

  if (Date.now() > session.expiry) {
    sessions.delete(token);
    return null;
  }

  return {
    userId: session.userId,
    email: session.email,
    name: session.name,
    role: session.role,
  };
}

/**
 * Verify a user session token
 */
export function verifyUserSession(token: string | null): boolean {
  return getSession(token) !== null;
}

/**
 * Invalidate a session (logout)
 */
export function invalidateUserSession(token: string): void {
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
export function getUserSessionToken(request: NextRequest): string | null {
  // Check Authorization header first
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  // Fall back to cookie
  const cookie = request.cookies.get('user_session');
  return cookie?.value || null;
}

/**
 * Middleware helper to require user authentication
 * Returns null if authenticated, or an error response if not
 */
export function requireUserAuth(request: NextRequest): NextResponse | null {
  const token = getUserSessionToken(request);

  if (!verifyUserSession(token)) {
    return NextResponse.json(
      { error: 'Unauthorized. Please log in.' },
      { status: 401 }
    );
  }

  return null; // Authenticated
}

/**
 * Get current user from request
 */
export function getCurrentUser(request: NextRequest): {
  userId: number;
  email: string;
  name: string;
  role: string;
} | null {
  const token = getUserSessionToken(request);
  return getSession(token);
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 */
export function validatePasswordStrength(password: string): { valid: boolean; message?: string } {
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' };
  }
  return { valid: true };
}

/**
 * Generate a secure password reset token
 * Returns a URL-safe token string
 */
export function generatePasswordResetToken(): string {
  return crypto.randomBytes(32).toString('base64url');
}

/**
 * Calculate password reset token expiry (1 hour from now)
 */
export function getPasswordResetExpiry(): Date {
  return new Date(Date.now() + 60 * 60 * 1000); // 1 hour
}
