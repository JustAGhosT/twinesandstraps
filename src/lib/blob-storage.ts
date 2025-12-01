/**
 * Blob Storage Utility
 * 
 * Provides abstraction for storing files in blob storage.
 * Supports Azure Blob Storage and falls back to base64 data URLs when not configured.
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
    throw new Error(`Failed to upload to Azure Blob Storage: ${response.status} - ${errorText}`);
  }

  return blobUrl;
}

/**
 * Convert file to base64 data URL (fallback when blob storage is not configured)
 */
function toBase64DataUrl(buffer: Buffer, contentType: string): string {
  const base64 = buffer.toString('base64');
  return `data:${contentType};base64,${base64}`;
}

/**
 * Upload a file to blob storage or return base64 data URL as fallback
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

  if (config) {
    // Upload to Azure Blob Storage
    try {
      const url = await uploadToAzureBlob(config, blobName, buffer, contentType);
      return {
        url,
        filename: blobName,
        size: file.size,
        type: contentType,
        storageType: 'blob',
      };
    } catch (error) {
      console.error('Blob storage upload failed, falling back to base64:', error);
      // Fall through to base64 fallback
    }
  }

  // Fallback to base64 data URL
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
 * Get storage status information
 */
export function getStorageStatus(): {
  configured: boolean;
  type: 'azure' | 'base64';
  message: string;
} {
  const isConfigured = isBlobStorageConfigured();
  return {
    configured: isConfigured,
    type: isConfigured ? 'azure' : 'base64',
    message: isConfigured 
      ? 'Azure Blob Storage is configured' 
      : 'Blob storage not configured. Images will be stored as base64 in the database.',
  };
}
