/**
 * Admin API for individual provider management
 * GET: Get provider configuration
 * PUT: Update provider configuration
 * DELETE: Delete provider configuration
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/admin-auth';
import { requireCsrfToken } from '@/lib/security/csrf';
import { getRateLimitConfig, withRateLimit } from '@/lib/security/rate-limit-wrapper';
import { 
  getProviderConfig, 
  upsertProviderConfig, 
  deleteProviderConfig,
  validateProviderConfig,
  type ProviderType 
} from '@/lib/providers/config-manager';
import { z } from 'zod';

const updateConfigSchema = z.object({
  configData: z.record(z.any()).optional(),
  credentials: z.record(z.any()).optional(),
  featureFlags: z.record(z.boolean()).optional(),
  isEnabled: z.boolean().optional(),
});

async function handleGET(
  request: NextRequest,
  { params }: { params: { type: string; name: string } }
) {
  const authError = await requireAdminAuth(request);
  if (authError) return authError;

  try {
    const config = await getProviderConfig(
      params.type as ProviderType,
      params.name
    );

    if (!config) {
      return NextResponse.json(
        { error: 'Provider configuration not found' },
        { status: 404 }
      );
    }

    // Don't return sensitive credentials in response
    const { credentials, ...safeConfig } = config;

    return NextResponse.json({
      config: safeConfig,
      hasCredentials: !!credentials && Object.keys(credentials).length > 0,
    });
  } catch (error) {
    console.error('Error fetching provider config:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handlePUT(
  request: NextRequest,
  { params }: { params: { type: string; name: string } }
) {
  const csrfError = requireCsrfToken(request);
  if (csrfError) return csrfError;

  const authError = await requireAdminAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const validation = updateConfigSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { configData, credentials, featureFlags, isEnabled } = validation.data;

    // Get existing config to merge
    const existing = await getProviderConfig(params.type as ProviderType, params.name);
    const mergedConfigData = { ...existing?.configData, ...configData };
    const mergedCredentials = { ...existing?.credentials, ...credentials };

    // Validate required fields before enabling
    if (isEnabled && params.name !== 'mock') {
      const missing = validateProviderConfig(
        params.type as ProviderType,
        params.name,
        mergedConfigData,
        mergedCredentials
      );
      if (missing.length > 0) {
        return NextResponse.json(
          { 
            error: 'Missing required configuration', 
            missingFields: missing,
            message: `Please configure the following fields before enabling: ${missing.join(', ')}`
          },
          { status: 400 }
        );
      }
    }

    const config = await upsertProviderConfig(
      params.type as ProviderType,
      params.name,
      {
        configData: mergedConfigData,
        credentials: mergedCredentials,
        featureFlags,
        isEnabled,
        isActive: isEnabled && params.name !== 'mock' ? true : false,
        errorMessage: null,
      }
    );

    // Don't return sensitive credentials
    const { credentials: _, ...safeConfig } = config;

    return NextResponse.json({
      success: true,
      config: safeConfig,
    });
  } catch (error) {
    console.error('Error updating provider config:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleDELETE(
  request: NextRequest,
  { params }: { params: { type: string; name: string } }
) {
  const csrfError = requireCsrfToken(request);
  if (csrfError) return csrfError;

  const authError = await requireAdminAuth(request);
  if (authError) return authError;

  try {
    await deleteProviderConfig(params.type as ProviderType, params.name);

    return NextResponse.json({
      success: true,
      message: 'Provider configuration deleted',
    });
  } catch (error) {
    console.error('Error deleting provider config:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = withRateLimit(handleGET, getRateLimitConfig('admin'));
export const PUT = withRateLimit(handlePUT, getRateLimitConfig('admin'));
export const DELETE = withRateLimit(handleDELETE, getRateLimitConfig('admin'));

