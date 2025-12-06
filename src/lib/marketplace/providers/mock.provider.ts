/**
 * Mock Marketplace Provider
 * For testing and development
 */

import { IMarketplaceProvider, MarketplaceProduct, MarketplaceOrder, InventoryUpdate } from '../provider.interface';

export class MockMarketplaceProvider implements IMarketplaceProvider {
  readonly name = 'mock';
  readonly displayName = 'Mock Marketplace';

  isConfigured(): boolean {
    return true; // Always available for testing
  }

  async createOrUpdateProduct(product: MarketplaceProduct): Promise<{
    success: boolean;
    sellerSku?: string;
    error?: string;
  }> {
    console.log('[Mock] Creating/updating product:', product.id);
    return {
      success: true,
      sellerSku: product.sellerSku || `mock_${product.id}`,
    };
  }

  async deleteProduct(sellerSku: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    console.log('[Mock] Deleting product:', sellerSku);
    return {
      success: true,
    };
  }

  async updateInventory(updates: InventoryUpdate[]): Promise<{
    success: boolean;
    errors?: Array<{ sellerSku: string; error: string }>;
  }> {
    console.log('[Mock] Updating inventory:', updates);
    return {
      success: true,
    };
  }

  async getOrders(filters?: {
    status?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<MarketplaceOrder[]> {
    console.log('[Mock] Getting orders with filters:', filters);
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
    console.log('[Mock] Fulfilling order:', marketplaceOrderId, trackingNumber);
    return {
      success: true,
    };
  }

  async generateFeed(products: MarketplaceProduct[]): Promise<string> {
    console.log('[Mock] Generating feed for', products.length, 'products');
    return JSON.stringify(products, null, 2);
  }

  getFeedFormat(): 'xml' | 'csv' | 'json' {
    return 'json';
  }

  validateProduct(product: MarketplaceProduct): {
    valid: boolean;
    errors: string[];
  } {
    return {
      valid: true,
      errors: [],
    };
  }
}

