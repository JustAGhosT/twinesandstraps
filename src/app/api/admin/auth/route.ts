import { NextRequest, NextResponse } from 'next/server';
import {
  getAdminPassword,
  checkRateLimit,
  recordFailedAttempt,
  clearLoginAttempts,
  createSession,
  invalidateSession,
  getSessionToken,
  getClientIP,
} from '@/lib/admin-auth';
import { loginSchema, validateBody, formatZodErrors } from '@/lib/validations';

export async function POST(request: NextRequest) {
  const ip = getClientIP(request);

  // Check rate limiting
  const rateLimit = checkRateLimit(ip);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: 'Too many login attempts. Please try again later.',
        retryAfter: rateLimit.retryAfter,
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(rateLimit.retryAfter),
        },
      }
    );
  }

  try {
    const body = await request.json();

    // Validate input
    const validation = validateBody(loginSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: formatZodErrors(validation.errors) },
        { status: 400 }
      );
    }

    const { password } = validation.data;

    // Get admin password from environment
    const adminPassword = getAdminPassword();
    if (!adminPassword) {
      console.error('Admin login attempted but ADMIN_PASSWORD not configured');
      return NextResponse.json(
        { error: 'Admin access is not configured. Please contact the administrator.' },
        { status: 503 }
      );
    }

    // Verify password
    if (password !== adminPassword) {
      recordFailedAttempt(ip);
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      );
    }

    // Success - clear failed attempts and create session
    clearLoginAttempts(ip);
    const session = createSession();

    const response = NextResponse.json({
      success: true,
      token: session.token,
      expiry: session.expiry,
    });

    // Set HTTP-only cookie for better security
    // Path must be '/' to cover both /admin pages and /api/admin/* routes
    response.cookies.set('admin_session', session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'An error occurred during login' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const token = getSessionToken(request);

  if (token) {
    invalidateSession(token);
  }

  const response = NextResponse.json({ success: true });

  // Clear the cookie - path must match login cookie path
  response.cookies.set('admin_session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
    path: '/',
  });

  return response;
}
