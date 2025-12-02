/**
 * Image caching utilities
 * 
 * These utilities help cache external product images locally to improve
 * performance and reduce dependency on external image sources.
 */

import { ALLOWED_IMAGE_CACHE_DOMAINS } from '@/constants';

/**
 * Check if a URL is from an allowed domain for caching
 */
export function isAllowedForCaching(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    return ALLOWED_IMAGE_CACHE_DOMAINS.some(
      (domain) =>
        parsedUrl.hostname === domain || parsedUrl.hostname.endsWith(`.${domain}`)
    );
  } catch {
    return false;
  }
}

/**
 * Generate a cached image URL for an external image
 * If the image URL is not from an allowed domain or is already local, 
 * returns the original URL
 * 
 * @param imageUrl - The original external image URL
 * @returns The cached image URL or original URL
 */
export function getCachedImageUrl(imageUrl: string | null | undefined): string | null {
  if (!imageUrl) {
    return null;
  }

  // If it's already a local/relative URL, return as-is
  if (imageUrl.startsWith('/') || imageUrl.startsWith('./')) {
    return imageUrl;
  }

  // Check if URL is valid and from an allowed domain
  if (!isAllowedForCaching(imageUrl)) {
    return imageUrl;
  }

  // Return the cached image URL
  return `/api/images/cache?url=${encodeURIComponent(imageUrl)}`;
}

/**
 * Check if an image URL is an external URL that could be cached
 */
export function isExternalImageUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
  } catch {
    return false;
  }
}
