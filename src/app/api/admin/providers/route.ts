/**
 * Admin API for provider management
 * GET: List all providers
 * POST: Create/update provider configuration
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/admin-auth';
import { requireCsrfToken } from '@/lib/security/csrf';
import { getRateLimitConfig, withRateLimit } from '@/lib/security/rate-limit-wrapper';
import { 
  getProviderConfigs, 
  upsertProviderConfig, 
  validateProviderConfig,
  type ProviderType 
} from '@/lib/providers/config-manager';
import { getAllShippingProviders } from '@/lib/shipping/provider.factory';
import { getAllPaymentProviders } from '@/lib/payment/provider.factory';
import { getAllEmailProviders } from '@/lib/email/provider.factory';
import { getAllAccountingProviders } from '@/lib/accounting/provider.factory';
import { getAllMarketplaceProviders } from '@/lib/marketplace/provider.factory';
import { z } from 'zod';

import { logInfo, logError, logWarn, logDebug } from '@/lib/logging/logger';

const providerConfigSchema = z.object({
  providerType: z.enum(['shipping', 'payment', 'email', 'accounting', 'marketplace']),
  providerName: z.string(),
  configData: z.record(z.any()).optional(),
  credentials: z.record(z.any()).optional(),
  featureFlags: z.record(z.boolean()).optional(),
  isEnabled: z.boolean().optional(),
});

async function handleGET(request: NextRequest) {
  const authError = await requireAdminAuth(request);
  if (authError) return authError;

  try {
    // Get all available providers
    const shippingProviders = getAllShippingProviders();
    const paymentProviders = getAllPaymentProviders();
    const emailProviders = getAllEmailProviders();
    const accountingProviders = getAllAccountingProviders();
    const marketplaceProviders = getAllMarketplaceProviders();

    // Get configurations from database
    const shippingConfigs = await getProviderConfigs('shipping');
    const paymentConfigs = await getProviderConfigs('payment');
    const emailConfigs = await getProviderConfigs('email');
    const accountingConfigs = await getProviderConfigs('accounting');
    const marketplaceConfigs = await getProviderConfigs('marketplace');

    // Merge provider info with configurations
    const providers = {
      shipping: shippingProviders.map(provider => {
        const config = shippingConfigs.find(c => c.providerName === provider.name);
        return {
          name: provider.name,
          displayName: provider.displayName,
          isConfigured: provider.isConfigured(),
          isEnabled: config?.isEnabled || false,
          isActive: config?.isActive || false,
          config: config ? {
            id: config.id,
            featureFlags: config.featureFlags,
            lastSyncedAt: config.lastSyncedAt,
            errorMessage: config.errorMessage,
          } : null,
        };
      }),
      payment: paymentProviders.map(provider => {
        const config = paymentConfigs.find(c => c.providerName === provider.name);
        return {
          name: provider.name,
          displayName: provider.displayName,
          isConfigured: provider.isConfigured(),
          isEnabled: config?.isEnabled || false,
          isActive: config?.isActive || false,
          config: config ? {
            id: config.id,
            featureFlags: config.featureFlags,
            lastSyncedAt: config.lastSyncedAt,
            errorMessage: config.errorMessage,
          } : null,
        };
      }),
      email: emailProviders.map(provider => {
        const config = emailConfigs.find(c => c.providerName === provider.name);
        return {
          name: provider.name,
          displayName: provider.displayName,
          isConfigured: provider.isConfigured(),
          isEnabled: config?.isEnabled || false,
          isActive: config?.isActive || false,
          config: config ? {
            id: config.id,
            featureFlags: config.featureFlags,
            lastSyncedAt: config.lastSyncedAt,
            errorMessage: config.errorMessage,
          } : null,
        };
      }),
      accounting: accountingProviders.map(provider => {
        const config = accountingConfigs.find(c => c.providerName === provider.name);
        return {
          name: provider.name,
          displayName: provider.displayName,
          isConfigured: provider.isConfigured(),
          isEnabled: config?.isEnabled || false,
          isActive: config?.isActive || false,
          config: config ? {
            id: config.id,
            featureFlags: config.featureFlags,
            lastSyncedAt: config.lastSyncedAt,
            errorMessage: config.errorMessage,
          } : null,
        };
      }),
      marketplace: marketplaceProviders.map((provider, index) => {
        const config = marketplaceConfigs.find(c => c.providerName === provider.name);
        return {
          id: index + 1, // Use index as ID for marketplace providers
          name: provider.name,
          displayName: provider.displayName,
          isConfigured: provider.isConfigured(),
          isEnabled: config?.isEnabled || false,
          isActive: config?.isActive || false,
          config: config ? {
            id: config.id,
            featureFlags: config.featureFlags,
            lastSyncedAt: config.lastSyncedAt,
            errorMessage: config.errorMessage,
          } : null,
        };
      }),
    };

    return NextResponse.json({ providers });
  } catch (error) {
    logError('Error fetching providers:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handlePOST(request: NextRequest) {
  const csrfError = requireCsrfToken(request);
  if (csrfError) return csrfError;

  const authError = await requireAdminAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const validation = providerConfigSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { providerType, providerName, configData = {}, credentials = {}, featureFlags, isEnabled } = validation.data;

    // Validate required fields before enabling
    if (isEnabled && providerName !== 'mock') {
      const missing = validateProviderConfig(providerType as ProviderType, providerName, configData, credentials);
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

    // Update configuration
    const config = await upsertProviderConfig(
      providerType as ProviderType,
      providerName,
      {
        configData,
        credentials,
        featureFlags,
        isEnabled: isEnabled ?? false,
        isActive: isEnabled && providerName !== 'mock' ? true : false, // Auto-activate if enabled and not mock
        errorMessage: null, // Clear errors on update
      }
    );

    return NextResponse.json({
      success: true,
      config,
    });
  } catch (error) {
    logError('Error updating provider config:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = withRateLimit(handleGET, getRateLimitConfig('admin'));
export const POST = withRateLimit(handlePOST, getRateLimitConfig('admin'));

