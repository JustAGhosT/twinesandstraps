import { NextRequest, NextResponse } from 'next/server';
import { getUserSessionToken, invalidateUserSession } from '@/lib/user-auth';

export async function POST(request: NextRequest) {
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
