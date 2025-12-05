/**
 * Client-side CSRF token utilities
 */

'use client';

/**
 * Get CSRF token from cookie (client-side)
 */
export function getCsrfTokenClient(): string | null {
  if (typeof document === 'undefined') {
    return null;
  }

  const cookies = document.cookie.split(';');
  const csrfCookie = cookies.find(cookie => cookie.trim().startsWith('csrf-token='));
  
  if (!csrfCookie) {
    return null;
  }

  return csrfCookie.split('=')[1];
}

/**
 * Get CSRF token for use in fetch requests
 */
export function getCsrfHeaders(): HeadersInit {
  const token = getCsrfTokenClient();
  
  if (!token) {
    return {};
  }

  return {
    'X-CSRF-Token': token,
  };
}

/**
 * Fetch with CSRF token automatically included
 */
export async function fetchWithCsrf(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = getCsrfTokenClient();
  
  const headers = new Headers(options.headers);
  if (token) {
    headers.set('X-CSRF-Token', token);
  }

  return fetch(url, {
    ...options,
    headers,
  });
}

