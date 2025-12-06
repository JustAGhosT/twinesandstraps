/**
 * Xero Token Database Storage
 * Manages Xero OAuth tokens in the database with automatic refresh
 */

import prisma from '@/lib/prisma';
import { refreshXeroToken, XeroToken, XeroTokenResponse } from './auth';

import { logInfo, logError, logWarn, logDebug } from '@/lib/logging/logger';

/**
 * Get the active Xero token, refreshing if necessary
 */
export async function getActiveXeroToken(): Promise<XeroToken | null> {
  const tokenRecord = await prisma.xeroToken.findFirst({
    where: { is_active: true },
    orderBy: { created_at: 'desc' },
  });

  if (!tokenRecord) {
    return null;
  }

  // Check if token needs refresh (within 5 minutes of expiry)
  const now = new Date();
  const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

  if (tokenRecord.expires_at <= fiveMinutesFromNow) {
    // Token expired or about to expire - refresh it
    try {
      const refreshed = await refreshXeroToken(tokenRecord.refresh_token);
      await updateXeroToken(tokenRecord.id, refreshed);
      
      return {
        accessToken: refreshed.access_token,
        refreshToken: refreshed.refresh_token,
        expiresAt: new Date(Date.now() + refreshed.expires_in * 1000),
        scope: refreshed.scope,
      };
    } catch (error: any) {
      logError('Failed to refresh Xero token:', error);
      // Mark token as inactive if refresh fails
      await prisma.xeroToken.update({
        where: { id: tokenRecord.id },
        data: { is_active: false },
      });
      return null;
    }
  }

  return {
    accessToken: tokenRecord.access_token,
    refreshToken: tokenRecord.refresh_token,
    expiresAt: tokenRecord.expires_at,
    scope: tokenRecord.scope,
  };
}

/**
 * Store a new Xero token (from OAuth callback)
 */
export async function storeXeroTokenInDb(tokenResponse: XeroTokenResponse): Promise<void> {
  const expiresAt = new Date(Date.now() + tokenResponse.expires_in * 1000);

  // Deactivate any existing tokens
  await prisma.xeroToken.updateMany({
    where: { is_active: true },
    data: { is_active: false },
  });

  // Store new token
  await prisma.xeroToken.create({
    data: {
      access_token: tokenResponse.access_token,
      refresh_token: tokenResponse.refresh_token,
      expires_at: expiresAt,
      scope: tokenResponse.scope,
      is_active: true,
    },
  });
}

/**
 * Update existing Xero token (after refresh)
 */
async function updateXeroToken(id: number, tokenResponse: XeroTokenResponse): Promise<void> {
  const expiresAt = new Date(Date.now() + tokenResponse.expires_in * 1000);

  await prisma.xeroToken.update({
    where: { id },
    data: {
      access_token: tokenResponse.access_token,
      refresh_token: tokenResponse.refresh_token,
      expires_at: expiresAt,
      scope: tokenResponse.scope,
      last_refreshed_at: new Date(),
    },
  });
}

/**
 * Check if Xero is connected
 */
export async function isXeroConnected(): Promise<boolean> {
  const token = await getActiveXeroToken();
  return token !== null;
}

/**
 * Disconnect Xero (deactivate all tokens)
 */
export async function disconnectXero(): Promise<void> {
  await prisma.xeroToken.updateMany({
    where: { is_active: true },
    data: { is_active: false },
  });
}

/**
 * Get Xero connection status
 */
export async function getXeroConnectionStatus(): Promise<{
  connected: boolean;
  expiresAt?: Date;
  lastRefreshed?: Date;
}> {
  const tokenRecord = await prisma.xeroToken.findFirst({
    where: { is_active: true },
    orderBy: { created_at: 'desc' },
  });

  if (!tokenRecord) {
    return { connected: false };
  }

  return {
    connected: true,
    expiresAt: tokenRecord.expires_at,
    lastRefreshed: tokenRecord.last_refreshed_at || undefined,
  };
}

