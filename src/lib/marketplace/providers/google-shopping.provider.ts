/**
 * Google Shopping / Merchant Center Provider
 * Implements IMarketplaceProvider interface
 */

import { IMarketplaceProvider, MarketplaceProduct, MarketplaceOrder, InventoryUpdate } from '../provider.interface';
import { generateGoogleShoppingFeed } from '../../marketplace/feeds';

const GOOGLE_MERCHANT_ID = process.env.GOOGLE_MERCHANT_ID || '';
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || '';

export class GoogleShoppingProvider implements IMarketplaceProvider {
  readonly name = 'google-shopping';
  readonly displayName = 'Google Shopping';

  isConfigured(): boolean {
    return !!GOOGLE_MERCHANT_ID;
  }

  async createOrUpdateProduct(product: MarketplaceProduct): Promise<{
    success: boolean;
    sellerSku?: string;
    error?: string;
  }> {
    // Google Shopping uses feed-based approach, not direct API
    // Products are managed via feed uploads
    return {
      success: true,
      sellerSku: product.id,
    };
  }

  async deleteProduct(sellerSku: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    // Products are removed from feed
    return {
      success: true,
    };
  }

  async updateInventory(updates: InventoryUpdate[]): Promise<{
    success: boolean;
    errors?: Array<{ sellerSku: string; error: string }>;
  }> {
    // Inventory updates via feed
    return {
      success: true,
    };
  }

  async getOrders(filters?: {
    status?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<MarketplaceOrder[]> {
    // Google Shopping doesn't handle orders directly
    // Orders come through your website
    return [];
  }

  async fulfillOrder(
    marketplaceOrderId: string,
    trackingNumber: string,
    carrier?: string
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    // Not applicable for Google Shopping
    return {
      success: false,
      error: 'Google Shopping does not handle order fulfillment',
    };
  }

  async generateFeed(products: MarketplaceProduct[]): Promise<string> {
    // Convert to FeedProduct format and generate XML
    const feedProducts = products.map(p => ({
      id: p.id,
      title: p.title,
      description: p.description,
      link: `${process.env.NEXT_PUBLIC_SITE_URL || ''}/products/${p.id}`,
      image_link: p.images[0] || '',
      price: `${p.price.toFixed(2)} ${p.currency}`,
      availability: p.quantity > 0 ? 'in stock' : 'out of stock',
      brand: p.brand || 'TASSA',
      condition: p.condition || 'new',
      category: '', // Would map to Google category
    }));

    // Use existing feed generation
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || '';
    const items = feedProducts.map((product) => `
      <item>
        <g:id>${escapeXml(product.id)}</g:id>
        <g:title>${escapeXml(product.title)}</g:title>
        <g:description>${escapeXml(product.description)}</g:description>
        <g:link>${escapeXml(product.link)}</g:link>
        <g:image_link>${escapeXml(product.image_link)}</g:image_link>
        <g:price>${escapeXml(product.price)}</g:price>
        <g:availability>${escapeXml(product.availability)}</g:availability>
        <g:brand>${escapeXml(product.brand)}</g:brand>
        <g:condition>${escapeXml(product.condition)}</g:condition>
      </item>
    `).join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>TASSA - Twines and Straps SA</title>
    <link>${siteUrl}</link>
    <description>Product feed for TASSA - Twines and Straps SA</description>
    ${items}
  </channel>
</rss>`;
  }

  getFeedFormat(): 'xml' | 'csv' | 'json' {
    return 'xml';
  }

  validateProduct(product: MarketplaceProduct): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!product.title || product.title.length < 10) {
      errors.push('Title must be at least 10 characters');
    }

    if (!product.description || product.description.length < 50) {
      errors.push('Description must be at least 50 characters');
    }

    if (product.price <= 0) {
      errors.push('Price must be greater than 0');
    }

    if (!product.images || product.images.length === 0) {
      errors.push('At least one image is required');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

