/**
 * Centralized environment variable access
 * Provides type-safe access to environment variables with validation
 */

function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key];
  if (!value && !defaultValue) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value || defaultValue || '';
}

/**
 * Get the site URL with proper fallback
 * Uses environment variable or falls back to localhost for development
 */
export function getSiteUrl(): string {
  if (typeof window !== 'undefined') {
    // Client-side: use current origin
    return window.location.origin;
  }
  
  // Server-side: use environment variable or default
  return getEnvVar('NEXT_PUBLIC_SITE_URL', 'http://localhost:3000');
}

/**
 * Database URL (server-side only)
 */
export function getDatabaseUrl(): string {
  return getEnvVar('DATABASE_URL');
}

/**
 * Azure Storage configuration
 */
export function getAzureStorageConfig() {
  return {
    accountName: getEnvVar('AZURE_STORAGE_ACCOUNT_NAME', ''),
    accountKey: getEnvVar('AZURE_STORAGE_ACCOUNT_KEY', ''),
    containerName: getEnvVar('AZURE_STORAGE_CONTAINER_NAME', ''),
  };
}

/**
 * Check if Azure Storage is configured
 */
export function isAzureStorageConfigured(): boolean {
  const config = getAzureStorageConfig();
  return !!(config.accountName && config.accountKey && config.containerName);
}

/**
 * WhatsApp number
 */
export function getWhatsAppNumber(): string {
  return getEnvVar('NEXT_PUBLIC_WHATSAPP_NUMBER', '');
}

/**
 * Node environment
 */
export function getNodeEnv(): 'development' | 'production' | 'test' {
  const env = getEnvVar('NODE_ENV', 'development');
  return env as 'development' | 'production' | 'test';
}

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  return getNodeEnv() === 'production';
}

