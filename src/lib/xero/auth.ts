/**
 * Xero OAuth 2.0 Authentication
 * Handles OAuth flow for Xero API integration
 */

import { getSiteUrl } from '@/lib/env';

export interface XeroConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
}

export interface XeroTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
}

export interface XeroToken {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  scope: string;
}

/**
 * Get Xero OAuth configuration
 */
export function getXeroConfig(): XeroConfig {
  return {
    clientId: process.env.XERO_CLIENT_ID || '',
    clientSecret: process.env.XERO_CLIENT_SECRET || '',
    redirectUri: `${getSiteUrl()}/api/xero/callback`,
    scopes: [
      'accounting.transactions',
      'accounting.contacts',
      'accounting.settings',
      'offline_access',
    ],
  };
}

/**
 * Check if Xero is configured
 */
export function isXeroConfigured(): boolean {
  const config = getXeroConfig();
  return !!(config.clientId && config.clientSecret);
}

/**
 * Generate Xero OAuth authorization URL
 */
export function getXeroAuthUrl(state?: string): string {
  const config = getXeroConfig();
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: config.scopes.join(' '),
    state: state || crypto.randomUUID(),
  });

  return `https://login.xero.com/identity/connect/authorize?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeXeroCode(code: string): Promise<XeroTokenResponse> {
  const config = getXeroConfig();

  const response = await fetch('https://identity.xero.com/connect/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: config.redirectUri,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to exchange code: ${error}`);
  }

  return response.json();
}

/**
 * Refresh Xero access token
 */
export async function refreshXeroToken(refreshToken: string): Promise<XeroTokenResponse> {
  const config = getXeroConfig();

  const response = await fetch('https://identity.xero.com/connect/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to refresh token: ${error}`);
  }

  return response.json();
}

/**
 * Store Xero token (should be stored securely in database)
 */
export async function storeXeroToken(token: XeroTokenResponse): Promise<XeroToken> {
  const expiresAt = new Date(Date.now() + token.expires_in * 1000);

  return {
    accessToken: token.access_token,
    refreshToken: token.refresh_token,
    expiresAt,
    scope: token.scope,
  };
}

