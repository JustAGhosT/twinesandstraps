/**
 * Facebook / Instagram Shops Provider
 * Implements IMarketplaceProvider interface
 */

import { IMarketplaceProvider, MarketplaceProduct, MarketplaceOrder, InventoryUpdate } from '../provider.interface';
import { generateFacebookCatalogFeed } from '../../marketplace/feeds';

const FACEBOOK_CATALOG_ID = process.env.FACEBOOK_CATALOG_ID || '';
const FACEBOOK_ACCESS_TOKEN = process.env.FACEBOOK_ACCESS_TOKEN || '';

export class FacebookProvider implements IMarketplaceProvider {
  readonly name = 'facebook';
  readonly displayName = 'Facebook/Instagram Shops';

  isConfigured(): boolean {
    return !!(FACEBOOK_CATALOG_ID && FACEBOOK_ACCESS_TOKEN);
  }

  async createOrUpdateProduct(product: MarketplaceProduct): Promise<{
    success: boolean;
    sellerSku?: string;
    error?: string;
  }> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'Facebook is not configured',
      };
    }

    try {
      // Facebook Catalog API
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${FACEBOOK_CATALOG_ID}/products`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            access_token: FACEBOOK_ACCESS_TOKEN,
            retailer_id: product.id,
            name: product.title,
            description: product.description,
            image_url: product.images[0],
            availability: product.quantity > 0 ? 'in stock' : 'out of stock',
            condition: product.condition || 'new',
            price: `${product.currency} ${product.price.toFixed(2)}`,
            brand: product.brand || 'TASSA',
            category: product.categoryId || '',
            url: `${process.env.NEXT_PUBLIC_SITE_URL || ''}/products/${product.id}`,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to create product');
      }

      const data = await response.json();
      return {
        success: true,
        sellerSku: data.id || product.id,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async deleteProduct(sellerSku: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'Facebook is not configured',
      };
    }

    try {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${sellerSku}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            access_token: FACEBOOK_ACCESS_TOKEN,
          }),
        }
      );

      return {
        success: response.ok,
        error: response.ok ? undefined : 'Failed to delete product',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async updateInventory(updates: InventoryUpdate[]): Promise<{
    success: boolean;
    errors?: Array<{ sellerSku: string; error: string }>;
  }> {
    // Facebook uses availability field in product update
    return {
      success: true,
    };
  }

  async getOrders(filters?: {
    status?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<MarketplaceOrder[]> {
    // Facebook Shops orders come through your website
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
    return {
      success: false,
      error: 'Facebook Shops does not handle order fulfillment',
    };
  }

  async generateFeed(products: MarketplaceProduct[]): Promise<string> {
    const feedProducts = products.map(p => ({
      id: p.id,
      title: p.title,
      description: p.description,
      image_url: p.images[0] || '',
      availability: p.quantity > 0 ? 'in stock' : 'out of stock',
      condition: p.condition || 'new',
      price: `${p.price.toFixed(2)}`,
      currency: p.currency,
      brand: p.brand || 'TASSA',
      url: `${process.env.NEXT_PUBLIC_SITE_URL || ''}/products/${p.id}`,
      category: p.categoryId || '',
      retailer_id: p.id,
    }));

    return JSON.stringify({ data: feedProducts }, null, 2);
  }

  getFeedFormat(): 'xml' | 'csv' | 'json' {
    return 'json';
  }

  validateProduct(product: MarketplaceProduct): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!product.title || product.title.length < 3) {
      errors.push('Title must be at least 3 characters');
    }

    if (!product.description || product.description.length < 20) {
      errors.push('Description must be at least 20 characters');
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

