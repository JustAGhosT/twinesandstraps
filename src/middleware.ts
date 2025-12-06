import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that don't require authentication
const PUBLIC_ADMIN_ROUTES = ['/admin/login'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Security headers
  const response = NextResponse.next();

  // Strict Transport Security (HSTS)
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  );

  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://connect.facebook.net",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: https: blob:",
    "font-src 'self' data: https://fonts.gstatic.com",
    "connect-src 'self' https://www.google-analytics.com https://www.googletagmanager.com https://*.facebook.com https://*.facebook.net",
    "frame-src 'self' https://www.google.com https://www.facebook.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join('; ');

  response.headers.set('Content-Security-Policy', csp);

  // X-Content-Type-Options
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // X-Frame-Options
  response.headers.set('X-Frame-Options', 'DENY');

  // X-XSS-Protection
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // Referrer-Policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions-Policy
  response.headers.set(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=(), payment=()'
  );

  // Only protect /admin routes
  if (!pathname.startsWith('/admin')) {
    return response;
  }

  // Allow public admin routes (login page)
  // Note: We don't redirect away from login even if a cookie exists, because
  // the cookie may be expired or invalid. Let the client-side AdminAuthContext
  // handle the redirect after verifying with the server.
  if (PUBLIC_ADMIN_ROUTES.some(route => pathname.startsWith(route))) {
    return response;
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
  return response;
}

export const config = {
  matcher: [
    // Match all admin routes
    '/admin/:path*',
  ],
};
