/**
 * Feature Flags System
 * Centralized feature flag management
 */

export interface FeatureFlag {
  key: string;
  name: string;
  description: string;
  category: string;
  enabled: boolean;
  defaultValue?: boolean;
}

export interface ProviderFeatureFlags {
  // Shipping
  shippingMultiProvider: boolean;
  shippingCollectionPoints: boolean;
  shippingAutoSelect: boolean;
  
  // Payment
  paymentMultipleMethods: boolean;
  paymentSavedCards: boolean;
  paymentInstallments: boolean;
  
  // Email
  emailTemplates: boolean;
  emailAutomation: boolean;
  emailBulkSending: boolean;
  
  // Accounting
  accountingAutoSync: boolean;
  accountingPaymentMatching: boolean;
  accountingInventorySync: boolean;
}

/**
 * Get feature flag value from environment or default
 */
export function getFeatureFlag(key: string, defaultValue: boolean = false): boolean {
  if (typeof window !== 'undefined') {
    // Client-side: check NEXT_PUBLIC_ env vars
    const envKey = `NEXT_PUBLIC_FEATURE_${key.toUpperCase().replace(/-/g, '_')}`;
    const value = process.env[envKey];
    if (value !== undefined) {
      return value === 'true' || value === '1';
    }
  } else {
    // Server-side: check regular env vars
    const envKey = `FEATURE_${key.toUpperCase().replace(/-/g, '_')}`;
    const value = process.env[envKey];
    if (value !== undefined) {
      return value === 'true' || value === '1';
    }
  }
  
  return defaultValue;
}

/**
 * Check if provider feature is enabled
 */
export function isProviderFeatureEnabled(
  providerType: 'shipping' | 'payment' | 'email' | 'accounting',
  feature: string
): boolean {
  const flagKey = `${providerType}_${feature}`;
  return getFeatureFlag(flagKey, false);
}

/**
 * Get all feature flags
 */
export function getAllFeatureFlags(): Record<string, boolean> {
  // This would typically come from database or config
  // For now, return environment-based flags
  return {
    'provider-management': getFeatureFlag('provider-management', true),
    'mock-providers': getFeatureFlag('mock-providers', process.env.NODE_ENV === 'development'),
    'shipping-multi-provider': getFeatureFlag('shipping-multi-provider', true),
    'payment-multiple-methods': getFeatureFlag('payment-multiple-methods', true),
    'email-automation': getFeatureFlag('email-automation', true),
    'accounting-auto-sync': getFeatureFlag('accounting-auto-sync', true),
  };
}

