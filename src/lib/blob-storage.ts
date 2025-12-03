/**
 * Blob Storage Utility
 * 
 * Provides abstraction for storing files in Azure Blob Storage.
 * 
 * IMPORTANT: Azure Blob Storage is REQUIRED for production deployments.
 * Base64 fallback is only allowed in development mode to prevent hitting
 * Azure App Service limits and to ensure proper image storage.
 * 
 * Required environment variables:
 * - AZURE_STORAGE_ACCOUNT_NAME
 * - AZURE_STORAGE_ACCOUNT_KEY
 * - AZURE_STORAGE_CONTAINER_NAME
 */

import { v4 as uuidv4 } from 'uuid';

// Blob storage configuration
interface BlobStorageConfig {
  accountName: string;
  accountKey: string;
  containerName: string;
  endpoint: string;
}

// Upload result type
export interface BlobUploadResult {
  url: string;
  filename: string;
  size: number;
  type: string;
  storageType: 'blob' | 'base64';
  containerName?: string;
}

// Storage status with detailed information
export interface StorageStatusInfo {
  configured: boolean;
  type: 'azure' | 'base64';
  message: string;
  isProduction: boolean;
  missingVariables: string[];
  containerName?: string;
  accountName?: string;
}

/**
 * Check if blob storage is configured
 */
export function isBlobStorageConfigured(): boolean {
  return !!(
    process.env.AZURE_STORAGE_ACCOUNT_NAME &&
    process.env.AZURE_STORAGE_ACCOUNT_KEY &&
    process.env.AZURE_STORAGE_CONTAINER_NAME
  );
}

/**
 * Check if we're in production environment
 */
function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Get list of missing Azure storage environment variables
 */
function getMissingVariables(): string[] {
  const missing: string[] = [];
  if (!process.env.AZURE_STORAGE_ACCOUNT_NAME) {
    missing.push('AZURE_STORAGE_ACCOUNT_NAME');
  }
  if (!process.env.AZURE_STORAGE_ACCOUNT_KEY) {
    missing.push('AZURE_STORAGE_ACCOUNT_KEY');
  }
  if (!process.env.AZURE_STORAGE_CONTAINER_NAME) {
    missing.push('AZURE_STORAGE_CONTAINER_NAME');
  }
  return missing;
}

/**
 * Get blob storage configuration
 */
function getBlobStorageConfig(): BlobStorageConfig | null {
  const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
  const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;
  const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || 'images';

  if (!accountName || !accountKey) {
    return null;
  }

  return {
    accountName,
    accountKey,
    containerName,
    endpoint: `https://${accountName}.blob.core.windows.net`,
  };
}

/**
 * Generate a unique blob name with the original extension
 */
function generateBlobName(originalFilename: string): string {
  const ext = originalFilename.split('.').pop()?.toLowerCase() || 'jpg';
  return `${uuidv4()}.${ext}`;
}

/**
 * Create HMAC-SHA256 signature for Azure Blob Storage
 */
async function createSignature(stringToSign: string, accountKey: string): Promise<string> {
  const keyBuffer = Buffer.from(accountKey, 'base64');
  const crypto = await import('crypto');
  const hmac = crypto.createHmac('sha256', keyBuffer);
  hmac.update(stringToSign, 'utf8');
  return hmac.digest('base64');
}

/**
 * Upload file to Azure Blob Storage
 */
async function uploadToAzureBlob(
  config: BlobStorageConfig,
  blobName: string,
  buffer: Buffer,
  contentType: string
): Promise<string> {
  const date = new Date().toUTCString();
  const contentLength = buffer.length;
  const blobUrl = `${config.endpoint}/${config.containerName}/${blobName}`;
  
  console.log(`[BLOB STORAGE] Uploading to container: ${config.containerName}, blob: ${blobName}`);
  
  // Azure Storage REST API authorization
  const stringToSign = [
    'PUT', // HTTP Verb
    '', // Content-Encoding
    '', // Content-Language
    contentLength.toString(), // Content-Length
    '', // Content-MD5
    contentType, // Content-Type
    '', // Date
    '', // If-Modified-Since
    '', // If-Match
    '', // If-None-Match
    '', // If-Unmodified-Since
    '', // Range
    // CanonicalizedHeaders
    `x-ms-blob-type:BlockBlob\nx-ms-date:${date}\nx-ms-version:2020-10-02`,
    // CanonicalizedResource
    `/${config.accountName}/${config.containerName}/${blobName}`,
  ].join('\n');

  const signature = await createSignature(stringToSign, config.accountKey);
  const authorizationHeader = `SharedKey ${config.accountName}:${signature}`;

  // Convert Buffer to Uint8Array for fetch body
  const bodyData = new Uint8Array(buffer);

  const response = await fetch(blobUrl, {
    method: 'PUT',
    headers: {
      'Authorization': authorizationHeader,
      'Content-Type': contentType,
      'Content-Length': contentLength.toString(),
      'x-ms-blob-type': 'BlockBlob',
      'x-ms-date': date,
      'x-ms-version': '2020-10-02',
    },
    body: bodyData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[BLOB STORAGE] Upload failed: ${response.status} - ${errorText}`);
    throw new Error(`Failed to upload to Azure Blob Storage (container: ${config.containerName}): ${response.status} - ${errorText}`);
  }

  console.log(`[BLOB STORAGE] Upload successful: ${blobUrl}`);
  return blobUrl;
}

/**
 * Convert file to base64 data URL (fallback when blob storage is not configured)
 * WARNING: Only available in development mode
 */
function toBase64DataUrl(buffer: Buffer, contentType: string): string {
  const base64 = buffer.toString('base64');
  return `data:${contentType};base64,${base64}`;
}

/**
 * Upload a file to Azure Blob Storage
 * 
 * In production, Azure Blob Storage is REQUIRED. If not configured,
 * an error will be thrown instead of falling back to base64.
 * 
 * In development, falls back to base64 for easier local development.
 * 
 * @throws Error if Azure Blob Storage is not configured in production
 */
export async function uploadFile(
  file: File,
  options?: { folder?: string }
): Promise<BlobUploadResult> {
  const config = getBlobStorageConfig();
  const buffer = Buffer.from(await file.arrayBuffer());
  const contentType = file.type;
  const blobName = options?.folder 
    ? `${options.folder}/${generateBlobName(file.name)}`
    : generateBlobName(file.name);

  // If Azure Blob Storage is configured, use it
  if (config) {
    const url = await uploadToAzureBlob(config, blobName, buffer, contentType);
    return {
      url,
      filename: blobName,
      size: file.size,
      type: contentType,
      storageType: 'blob',
      containerName: config.containerName,
    };
  }

  // In production, Azure Blob Storage is REQUIRED
  if (isProduction()) {
    const missing = getMissingVariables();
    throw new Error(
      `Azure Blob Storage is required in production but not configured. ` +
      `Missing environment variables: ${missing.join(', ')}. ` +
      `Please configure Azure Blob Storage in your Azure App Service environment variables.`
    );
  }

  // In development, allow base64 fallback with a warning
  console.warn(
    '[BLOB STORAGE] Azure Blob Storage is not configured. ' +
    'Falling back to base64 encoding. ' +
    'This is only allowed in development mode. ' +
    `Missing: ${getMissingVariables().join(', ')}`
  );

  const dataUrl = toBase64DataUrl(buffer, contentType);
  return {
    url: dataUrl,
    filename: file.name,
    size: file.size,
    type: contentType,
    storageType: 'base64',
  };
}

/**
 * Delete a blob from storage (only works with blob storage, not base64)
 */
export async function deleteBlob(blobUrl: string): Promise<boolean> {
  const config = getBlobStorageConfig();
  
  if (!config || blobUrl.startsWith('data:')) {
    // Cannot delete base64 data URLs or if blob storage is not configured
    return true;
  }

  try {
    const date = new Date().toUTCString();
    const urlParts = new URL(blobUrl);
    const blobPath = urlParts.pathname.slice(1); // Remove leading /
    
    const stringToSign = [
      'DELETE',
      '', '', '', '', '', '', '', '', '', '', '',
      `x-ms-date:${date}\nx-ms-version:2020-10-02`,
      `/${config.accountName}/${blobPath}`,
    ].join('\n');

    const signature = await createSignature(stringToSign, config.accountKey);
    const authorizationHeader = `SharedKey ${config.accountName}:${signature}`;

    const response = await fetch(blobUrl, {
      method: 'DELETE',
      headers: {
        'Authorization': authorizationHeader,
        'x-ms-date': date,
        'x-ms-version': '2020-10-02',
      },
    });

    return response.ok || response.status === 404;
  } catch (error) {
    console.error('Failed to delete blob:', error);
    return false;
  }
}

/**
 * Get storage status information with detailed diagnostics
 */
export function getStorageStatus(): StorageStatusInfo {
  const isConfigured = isBlobStorageConfigured();
  const isProd = isProduction();
  const missing = getMissingVariables();
  const config = getBlobStorageConfig();
  
  let message: string;
  if (isConfigured) {
    message = `Azure Blob Storage is configured and ready. Container: ${config?.containerName}`;
  } else if (isProd) {
    message = `Azure Blob Storage is REQUIRED but not configured. Missing: ${missing.join(', ')}`;
  } else {
    message = `Development mode: Using base64 fallback. Configure Azure for production. Missing: ${missing.join(', ')}`;
  }

  return {
    configured: isConfigured,
    type: isConfigured ? 'azure' : 'base64',
    message,
    isProduction: isProd,
    missingVariables: missing,
    containerName: config?.containerName,
    accountName: config?.accountName,
  };
}
