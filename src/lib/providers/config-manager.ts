/**
 * Provider Configuration Manager
 * Manages provider settings, credentials, and activation status
 */

import prisma from '../prisma';

export type ProviderType = 'shipping' | 'payment' | 'email' | 'accounting' | 'marketplace';

export interface ProviderConfigData {
  [key: string]: any;
}

export interface ProviderCredentials {
  [key: string]: string | number | boolean;
}

export interface ProviderConfig {
  id: number;
  providerType: ProviderType;
  providerName: string;
  isEnabled: boolean;
  isActive: boolean;
  configData: ProviderConfigData;
  credentials?: ProviderCredentials;
  featureFlags?: Record<string, boolean>;
  lastSyncedAt?: Date;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Get provider configuration
 */
export async function getProviderConfig(
  providerType: ProviderType,
  providerName: string
): Promise<ProviderConfig | null> {
  const config = await prisma.providerConfig.findUnique({
    where: {
      provider_type_provider_name: {
        provider_type: providerType,
        provider_name: providerName,
      },
    },
  });

  if (!config) {
    return null;
  }

  return {
    id: config.id,
    providerType: config.provider_type as ProviderType,
    providerName: config.provider_name,
    isEnabled: config.is_enabled,
    isActive: config.is_active,
    configData: config.config_data as ProviderConfigData,
    credentials: config.credentials as ProviderCredentials | undefined,
    featureFlags: config.feature_flags as Record<string, boolean> | undefined,
    lastSyncedAt: config.last_synced_at || undefined,
    errorMessage: config.error_message || undefined,
    createdAt: config.created_at,
    updatedAt: config.updated_at,
  };
}

/**
 * Get all provider configurations for a type
 */
export async function getProviderConfigs(
  providerType: ProviderType
): Promise<ProviderConfig[]> {
  const configs = await prisma.providerConfig.findMany({
    where: { provider_type: providerType },
    orderBy: { updated_at: 'desc' },
  });

  return configs.map(config => ({
    id: config.id,
    providerType: config.provider_type as ProviderType,
    providerName: config.provider_name,
    isEnabled: config.is_enabled,
    isActive: config.is_active,
    configData: config.config_data as ProviderConfigData,
    credentials: config.credentials as ProviderCredentials | undefined,
    featureFlags: config.feature_flags as Record<string, boolean> | undefined,
    lastSyncedAt: config.last_synced_at || undefined,
    errorMessage: config.error_message || undefined,
    createdAt: config.created_at,
    updatedAt: config.updated_at,
  }));
}

/**
 * Create or update provider configuration
 */
export async function upsertProviderConfig(
  providerType: ProviderType,
  providerName: string,
  data: {
    configData?: ProviderConfigData;
    credentials?: ProviderCredentials;
    featureFlags?: Record<string, boolean>;
    isEnabled?: boolean;
    isActive?: boolean;
    errorMessage?: string;
  }
): Promise<ProviderConfig> {
  const config = await prisma.providerConfig.upsert({
    where: {
      provider_type_provider_name: {
        provider_type: providerType,
        provider_name: providerName,
      },
    },
    create: {
      provider_type: providerType,
      provider_name: providerName,
      is_enabled: data.isEnabled ?? false,
      is_active: data.isActive ?? false,
      config_data: data.configData || {},
      credentials: data.credentials || null,
      feature_flags: data.featureFlags || null,
      error_message: data.errorMessage || null,
    },
    update: {
      ...(data.configData !== undefined && { config_data: data.configData }),
      ...(data.credentials !== undefined && { credentials: data.credentials }),
      ...(data.featureFlags !== undefined && { feature_flags: data.featureFlags }),
      ...(data.isEnabled !== undefined && { is_enabled: data.isEnabled }),
      ...(data.isActive !== undefined && { is_active: data.isActive }),
      ...(data.errorMessage !== undefined && { error_message: data.errorMessage }),
      updated_at: new Date(),
    },
  });

  return {
    id: config.id,
    providerType: config.provider_type as ProviderType,
    providerName: config.provider_name,
    isEnabled: config.is_enabled,
    isActive: config.is_active,
    configData: config.config_data as ProviderConfigData,
    credentials: config.credentials as ProviderCredentials | undefined,
    featureFlags: config.feature_flags as Record<string, boolean> | undefined,
    lastSyncedAt: config.last_synced_at || undefined,
    errorMessage: config.error_message || undefined,
    createdAt: config.created_at,
    updatedAt: config.updated_at,
  };
}

/**
 * Delete provider configuration
 */
export async function deleteProviderConfig(
  providerType: ProviderType,
  providerName: string
): Promise<void> {
  await prisma.providerConfig.delete({
    where: {
      provider_type_provider_name: {
        provider_type: providerType,
        provider_name: providerName,
      },
    },
  });
}

/**
 * Validate provider configuration
 * Returns list of missing required fields
 */
export function validateProviderConfig(
  providerType: ProviderType,
  providerName: string,
  configData: ProviderConfigData,
  credentials?: ProviderCredentials
): string[] {
  const missing: string[] = [];

  // Define required fields for each provider
  const requiredFields: Record<string, Record<string, string[]>> = {
    shipping: {
      'courier-guy': ['apiKey'],
      'pargo': ['apiKey', 'clientId'],
      'fastway': ['apiKey', 'accountNumber'],
    },
    payment: {
      'payfast': ['merchantId', 'merchantKey', 'passphrase'],
      'paystack': ['publicKey', 'secretKey'],
      'yoco': ['publicKey', 'secretKey'],
    },
    email: {
      'brevo': ['apiKey'],
      'sendgrid': ['apiKey'],
      'ses': ['accessKeyId', 'secretAccessKey', 'region'],
    },
    accounting: {
      'xero': ['clientId', 'clientSecret', 'tenantId'],
      'quickbooks': ['clientId', 'clientSecret'],
    },
    marketplace: {
      'takealot': ['apiKey', 'sellerId'],
      'google-shopping': ['merchantId'],
      'facebook': ['catalogId', 'accessToken'],
    },
  };

  const required = requiredFields[providerType]?.[providerName] || [];
  
  // Check config data
  for (const field of required) {
    if (!configData[field] && !credentials?.[field]) {
      missing.push(field);
    }
  }

  return missing;
}

