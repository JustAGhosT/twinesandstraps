import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/user-auth';

export async function GET(request: NextRequest) {
  const user = getCurrentUser(request);

  if (!user) {
    return NextResponse.json(
      { authenticated: false, user: null },
      { status: 200 }
    );
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      id: user.userId,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
}
