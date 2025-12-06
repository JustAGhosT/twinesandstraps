/**
 * API Supplier Provider
 * For suppliers with REST API integration
 */

import { ISupplierProvider, SupplierProduct, SupplierOrder } from '../provider.interface';

import { logInfo, logError, logWarn, logDebug } from '@/lib/logging/logger';

export class ApiSupplierProvider implements ISupplierProvider {
  readonly name = 'api';
  readonly displayName = 'API Integration';

  private apiUrl: string;
  private apiKey: string;

  constructor(apiUrl?: string, apiKey?: string) {
    this.apiUrl = apiUrl || '';
    this.apiKey = apiKey || '';
  }

  isConfigured(): boolean {
    return !!(this.apiUrl && this.apiKey);
  }

  async fetchProducts(filters?: {
    category?: string;
    updatedSince?: Date;
    sku?: string;
  }): Promise<SupplierProduct[]> {
    if (!this.isConfigured()) {
      return [];
    }

    try {
      const params = new URLSearchParams();
      if (filters?.category) params.append('category', filters.category);
      if (filters?.updatedSince) params.append('updated_since', filters.updatedSince.toISOString());
      if (filters?.sku) params.append('sku', filters.sku);

      const response = await fetch(`${this.apiUrl}/products?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();
      return (data.products || []).map((p: any) => ({
        supplierSku: p.sku || p.supplier_sku,
        name: p.name || p.title,
        description: p.description,
        price: p.price,
        currency: p.currency || 'ZAR',
        quantity: p.quantity || p.stock || 0,
        category: p.category,
        brand: p.brand,
        images: p.images || [],
        attributes: p.attributes || {},
        leadTimeDays: p.lead_time_days,
        minOrderQuantity: p.min_order_quantity,
        updatedAt: p.updated_at ? new Date(p.updated_at) : undefined,
      }));
    } catch (error) {
      logError('Error fetching products from supplier API:', error);
      return [];
    }
  }

  async getProduct(supplierSku: string): Promise<SupplierProduct | null> {
    if (!this.isConfigured()) {
      return null;
    }

    try {
      const response = await fetch(`${this.apiUrl}/products/${supplierSku}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return {
        supplierSku: data.sku || data.supplier_sku,
        name: data.name || data.title,
        description: data.description,
        price: data.price,
        currency: data.currency || 'ZAR',
        quantity: data.quantity || data.stock || 0,
        category: data.category,
        brand: data.brand,
        images: data.images || [],
        attributes: data.attributes || {},
        leadTimeDays: data.lead_time_days,
        minOrderQuantity: data.min_order_quantity,
        updatedAt: data.updated_at ? new Date(data.updated_at) : undefined,
      };
    } catch (error) {
      logError('Error fetching product from supplier API:', error);
      return null;
    }
  }

  async getInventory(supplierSkus?: string[]): Promise<Map<string, number>> {
    if (!this.isConfigured()) {
      return new Map();
    }

    try {
      const url = supplierSkus
        ? `${this.apiUrl}/inventory?skus=${supplierSkus.join(',')}`
        : `${this.apiUrl}/inventory`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        return new Map();
      }

      const data = await response.json();
      const inventory = new Map<string, number>();

      (data.inventory || []).forEach((item: any) => {
        inventory.set(item.sku || item.supplier_sku, item.quantity || item.stock || 0);
      });

      return inventory;
    } catch (error) {
      logError('Error fetching inventory from supplier API:', error);
      return new Map();
    }
  }

  async getPricing(supplierSkus?: string[]): Promise<Map<string, number>> {
    if (!this.isConfigured()) {
      return new Map();
    }

    try {
      const url = supplierSkus
        ? `${this.apiUrl}/pricing?skus=${supplierSkus.join(',')}`
        : `${this.apiUrl}/pricing`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        return new Map();
      }

      const data = await response.json();
      const pricing = new Map<string, number>();

      (data.pricing || []).forEach((item: any) => {
        pricing.set(item.sku || item.supplier_sku, item.price || 0);
      });

      return pricing;
    } catch (error) {
      logError('Error fetching pricing from supplier API:', error);
      return new Map();
    }
  }

  async placeOrder(order: SupplierOrder): Promise<{
    success: boolean;
    supplierOrderId?: string;
    estimatedDelivery?: Date;
    error?: string;
  }> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'API not configured',
      };
    }

    try {
      const response = await fetch(`${this.apiUrl}/orders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: order.items,
          total: order.total,
          currency: order.currency,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to place order');
      }

      const data = await response.json();
      return {
        success: true,
        supplierOrderId: data.order_id || data.supplier_order_id,
        estimatedDelivery: data.estimated_delivery ? new Date(data.estimated_delivery) : undefined,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getOrderStatus(supplierOrderId: string): Promise<{
    status: string;
    trackingNumber?: string;
    estimatedDelivery?: Date;
  } | null> {
    if (!this.isConfigured()) {
      return null;
    }

    try {
      const response = await fetch(`${this.apiUrl}/orders/${supplierOrderId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return {
        status: data.status,
        trackingNumber: data.tracking_number,
        estimatedDelivery: data.estimated_delivery ? new Date(data.estimated_delivery) : undefined,
      };
    } catch (error) {
      logError('Error fetching order status from supplier API:', error);
      return null;
    }
  }

  supportsRealtimeSync(): boolean {
    return true; // API providers typically support real-time
  }

  getRecommendedSyncSchedule(): 'realtime' | 'hourly' | 'daily' | 'weekly' | 'manual' {
    return 'hourly'; // API can sync more frequently
  }

  validateProduct(product: SupplierProduct): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!product.supplierSku) {
      errors.push('Supplier SKU is required');
    }

    if (!product.name || product.name.length < 3) {
      errors.push('Product name must be at least 3 characters');
    }

    if (product.price <= 0) {
      errors.push('Price must be greater than 0');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

