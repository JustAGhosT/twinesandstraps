/**
 * Product URL utilities
 * Handles both slug and ID-based URLs for backward compatibility
 */

import type { Product } from '@/types/database';

/**
 * Get product URL (prefers slug, falls back to ID)
 */
export function getProductUrl(product: { id: number; slug?: string | null }): string {
  return `/products/${product.slug || product.id}`;
}

/**
 * Get product URL for external use (with site URL)
 */
export function getProductUrlAbsolute(
  product: { id: number; slug?: string | null },
  siteUrl: string
): string {
  return `${siteUrl}/products/${product.slug || product.id}`;
}

