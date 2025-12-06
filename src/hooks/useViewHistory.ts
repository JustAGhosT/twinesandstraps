'use client';

import { useCallback } from 'react';
import { useUserAuth } from '@/contexts/UserAuthContext';

import { logInfo, logError, logWarn, logDebug } from '@/lib/logging/logger';

export function useViewHistory() {
  const { isAuthenticated } = useUserAuth();

  const trackView = useCallback(async (productId: number) => {
    // Only track for authenticated users
    if (!isAuthenticated) return;

    try {
      await fetch('/api/user/view-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      });
    } catch (error) {
      // Silently fail - view tracking is not critical
      logError('Failed to track view:', error);
    }
  }, [isAuthenticated]);

  return { trackView };
}
