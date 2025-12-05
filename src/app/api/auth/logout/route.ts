import { NextRequest, NextResponse } from 'next/server';
import { getUserSessionToken, invalidateUserSession } from '@/lib/user-auth';
import { requireCsrfToken } from '@/lib/security/csrf';
import { withRateLimit, getRateLimitConfig } from '@/lib/security/rate-limit-wrapper';

async function handlePOST(request: NextRequest) {
  // Verify CSRF token
  const csrfError = requireCsrfToken(request);
  if (csrfError) return csrfError;
  const token = getUserSessionToken(request);

  if (token) {
    invalidateUserSession(token);
  }

  const response = NextResponse.json({ success: true });

  // Clear the cookie
  response.cookies.set('user_session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
    path: '/',
  });

  return response;
}

export const POST = withRateLimit(handlePOST, getRateLimitConfig('auth'));
