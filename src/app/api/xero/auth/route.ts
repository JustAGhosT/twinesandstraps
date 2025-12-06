/**
 * Xero OAuth authorization endpoint
 * Initiates OAuth flow
 */

import { NextRequest, NextResponse } from 'next/server';
import { getXeroAuthUrl, isXeroConfigured } from '@/lib/xero/auth';
import { requireAdminAuth } from '@/lib/admin-auth';

export async function GET(request: NextRequest) {
  // Verify admin authentication
  const authError = await requireAdminAuth(request);
  if (authError) return authError;

  if (!isXeroConfigured()) {
    return NextResponse.json(
      { error: 'Xero is not configured. Please set XERO_CLIENT_ID and XERO_CLIENT_SECRET environment variables.' },
      { status: 400 }
    );
  }

  // Generate state for CSRF protection
  const state = crypto.randomUUID();

  // Store state in session/cookie for verification
  const response = NextResponse.redirect(getXeroAuthUrl(state));
  response.cookies.set('xero_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 10 * 60, // 10 minutes
    path: '/',
  });

  return response;
}

