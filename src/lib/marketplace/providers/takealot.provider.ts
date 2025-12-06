/**
 * Takealot Marketplace Provider
 * Implements IMarketplaceProvider interface
 */

import { IMarketplaceProvider, MarketplaceProduct, MarketplaceOrder, InventoryUpdate } from '../provider.interface';
import { syncProductToTakealot, syncInventoryToTakealot, getTakealotOrders, fulfillTakealotOrder } from '../../marketplace/takealot';

const TAKEALOT_API_KEY = process.env.TAKEALOT_API_KEY || '';
const TAKEALOT_SELLER_ID = process.env.TAKEALOT_SELLER_ID || '';

export class TakealotProvider implements IMarketplaceProvider {
  readonly name = 'takealot';
  readonly displayName = 'Takealot';

  isConfigured(): boolean {
    return !!(TAKEALOT_API_KEY && TAKEALOT_SELLER_ID);
  }

  async createOrUpdateProduct(product: MarketplaceProduct): Promise<{
    success: boolean;
    sellerSku?: string;
    error?: string;
  }> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'Takealot is not configured',
      };
    }

    const result = await syncProductToTakealot(
      parseInt(product.id),
      {
        seller_sku: product.sellerSku || product.id,
        title: product.title,
        description: product.description,
        price: product.price,
        quantity: product.quantity,
        category_id: product.categoryId || '',
        brand: product.brand || 'TASSA',
        images: product.images,
        attributes: product.attributes,
      }
    );

    return {
      success: result.success,
      sellerSku: result.takealotSku,
      error: result.error,
    };
  }

  async deleteProduct(sellerSku: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'Takealot is not configured',
      };
    }

    // Takealot API would have a delete endpoint
    // This is a placeholder
    try {
      const response = await fetch(
        `${process.env.TAKEALOT_API_URL || 'https://api.takealot.com'}/v1/products/${sellerSku}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${TAKEALOT_API_KEY}`,
            'X-Seller-ID': TAKEALOT_SELLER_ID,
          },
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
    if (!this.isConfigured()) {
      return {
        success: false,
        errors: updates.map(u => ({ sellerSku: u.sellerSku, error: 'Takealot is not configured' })),
      };
    }

    const errors: Array<{ sellerSku: string; error: string }> = [];

    for (const update of updates) {
      const success = await syncInventoryToTakealot(update.sellerSku, update.quantity);
      if (!success) {
        errors.push({ sellerSku: update.sellerSku, error: 'Failed to update inventory' });
      }
    }

    return {
      success: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  async getOrders(filters?: {
    status?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<MarketplaceOrder[]> {
    if (!this.isConfigured()) {
      return [];
    }

    const takealotOrders = await getTakealotOrders(filters);

    return takealotOrders.map(order => ({
      orderId: order.order_id,
      marketplaceOrderId: order.order_id,
      orderDate: new Date(order.order_date),
      status: 'pending' as const, // Would map from Takealot status
      items: order.items,
      shippingAddress: {
        name: order.shipping_address.name,
        address: order.shipping_address.address,
        city: order.shipping_address.city,
        province: order.shipping_address.province,
        postalCode: order.shipping_address.postal_code,
        phone: order.shipping_address.phone,
      },
      total: order.items.reduce((sum, item) => sum + item.price * item.quantity, 0),
      currency: 'ZAR',
    }));
  }

  async fulfillOrder(
    marketplaceOrderId: string,
    trackingNumber: string,
    carrier?: string
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'Takealot is not configured',
      };
    }

    const success = await fulfillTakealotOrder(marketplaceOrderId, trackingNumber, carrier);
    return {
      success,
      error: success ? undefined : 'Failed to fulfill order',
    };
  }

  async generateFeed(products: MarketplaceProduct[]): Promise<string> {
    // Generate CSV feed for Takealot
    const headers = [
      'Seller SKU',
      'Title',
      'Description',
      'Price',
      'Quantity',
      'Category ID',
      'Brand',
      'Image URLs',
      'Condition',
    ];

    const rows = products.map(product => [
      product.sellerSku || product.id,
      product.title,
      product.description.replace(/"/g, '""'),
      product.price.toString(),
      product.quantity.toString(),
      product.categoryId || '',
      product.brand || 'TASSA',
      product.images.join('|'),
      product.condition || 'new',
    ].map(field => `"${field}"`).join(','));

    return [headers.map(h => `"${h}"`).join(','), ...rows].join('\n');
  }

  getFeedFormat(): 'xml' | 'csv' | 'json' {
    return 'csv';
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

    if (product.quantity < 0) {
      errors.push('Quantity cannot be negative');
    }

    if (!product.images || product.images.length === 0) {
      errors.push('At least one image is required');
    }

    if (product.images && product.images.length > 10) {
      errors.push('Maximum 10 images allowed');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

