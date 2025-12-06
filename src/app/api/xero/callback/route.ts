/**
 * Xero OAuth callback endpoint
 * Handles OAuth callback and stores tokens
 */

import { requireAdminAuth } from '@/lib/admin-auth';
import { exchangeXeroCode } from '@/lib/xero/auth';
import { storeXeroTokenInDb } from '@/lib/xero/token-storage';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Verify admin authentication
  const authError = await requireAdminAuth(request);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  // Check for OAuth errors
  if (error) {
    return NextResponse.redirect(
      `/admin/settings?xero_error=${encodeURIComponent(error)}`
    );
  }

  // Verify state
  const storedState = request.cookies.get('xero_oauth_state')?.value;
  if (!state || state !== storedState) {
    return NextResponse.redirect(
      '/admin/settings?xero_error=invalid_state'
    );
  }

  if (!code) {
    return NextResponse.redirect(
      '/admin/settings?xero_error=no_code'
    );
  }

  try {
    // Exchange code for tokens
    const tokenResponse = await exchangeXeroCode(code);
    
    // Store token in database
    await storeXeroTokenInDb(tokenResponse);

    // Clear state cookie
    const response = NextResponse.redirect('/admin/settings?xero_success=true');
    response.cookies.delete('xero_oauth_state');

    return response;
  } catch (error: any) {
    console.error('Xero OAuth error:', error);
    return NextResponse.redirect(
      `/admin/settings?xero_error=${encodeURIComponent(error.message || 'oauth_failed')}`
    );
  }
}

