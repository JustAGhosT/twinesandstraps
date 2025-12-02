/**
 * Image-related constants
 */

/**
 * Domains that are allowed for image caching
 * Images from these domains will be fetched and cached locally
 */
export const ALLOWED_IMAGE_CACHE_DOMAINS = [
  'images.unsplash.com',
  'blob.core.windows.net', // Azure Blob Storage
] as const;

/**
 * Supported image content types for caching
 */
export const SUPPORTED_IMAGE_CONTENT_TYPES: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/svg+xml': '.svg',
} as const;
