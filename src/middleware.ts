import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that don't require authentication
const PUBLIC_ADMIN_ROUTES = ['/admin/login'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect /admin routes
  if (!pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  // Allow public admin routes (login page)
  if (PUBLIC_ADMIN_ROUTES.some(route => pathname.startsWith(route))) {
    // If already logged in, redirect to dashboard
    const session = request.cookies.get('admin_session');
    if (session?.value) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    return NextResponse.next();
  }

  // Check for session cookie
  const session = request.cookies.get('admin_session');

  if (!session?.value) {
    // No session - redirect to login
    const loginUrl = new URL('/admin/login', request.url);
    // Preserve the original URL to redirect back after login
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Session exists - allow access
  // Full session validation happens in API routes
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all admin routes
    '/admin/:path*',
  ],
};
