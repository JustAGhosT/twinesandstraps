/**
 * API endpoint to get CSRF token
 * Sets token in cookie and returns it for client-side use
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateCsrfToken } from '@/lib/security/csrf';

export async function GET(request: NextRequest) {
  try {
    const token = generateCsrfToken();

    const response = NextResponse.json({
      token,
    });

    // Set CSRF token in cookie
    response.cookies.set('csrf-token', token, {
      httpOnly: false, // Must be accessible to JavaScript for Double Submit Cookie pattern
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Error generating CSRF token:', error);
    return NextResponse.json(
      { error: 'Failed to generate CSRF token' },
      { status: 500 }
    );
  }
}

