/**
 * CSRF Token Provider
 * Initializes and manages CSRF token on client-side
 */

'use client';

import { useEffect, useState } from 'react';

import { logInfo, logError, logWarn, logDebug } from '@/lib/logging/logger';

export function CsrfProvider({ children }: { children: React.ReactNode }) {
  const [csrfToken, setCsrfToken] = useState<string | null>(null);

  useEffect(() => {
    // Fetch CSRF token on mount
    fetch('/api/csrf-token')
      .then(res => res.json())
      .then(data => {
        if (data.token) {
          setCsrfToken(data.token);
        }
      })
      .catch(error => {
        logError('Failed to fetch CSRF token:', error);
      });
  }, []);

  // Token is set in cookie by the API, so we don't need to pass it via context
  // The cookie will be automatically included in requests
  return <>{children}</>;
}

