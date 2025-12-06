/**
 * Manual Supplier Provider
 * For suppliers without API integration - manual data entry/CSV import
 */

import { ISupplierProvider, SupplierProduct, SupplierOrder } from '../provider.interface';

export class ManualSupplierProvider implements ISupplierProvider {
  readonly name = 'manual';
  readonly displayName = 'Manual Entry';

  isConfigured(): boolean {
    return true; // Always available
  }

  async fetchProducts(filters?: {
    category?: string;
    updatedSince?: Date;
    sku?: string;
  }): Promise<SupplierProduct[]> {
    // Manual provider doesn't fetch - products are entered manually
    return [];
  }

  async getProduct(supplierSku: string): Promise<SupplierProduct | null> {
    // Would query database for manually entered products
    return null;
  }

  async getInventory(supplierSkus?: string[]): Promise<Map<string, number>> {
    // Manual inventory tracking
    return new Map();
  }

  async getPricing(supplierSkus?: string[]): Promise<Map<string, number>> {
    // Manual pricing entry
    return new Map();
  }

  async placeOrder(order: SupplierOrder): Promise<{
    success: boolean;
    supplierOrderId?: string;
    estimatedDelivery?: Date;
    error?: string;
  }> {
    // Manual order placement - would create order record
    return {
      success: true,
      supplierOrderId: `MANUAL-${Date.now()}`,
    };
  }

  async getOrderStatus(supplierOrderId: string): Promise<{
    status: string;
    trackingNumber?: string;
    estimatedDelivery?: Date;
  } | null> {
    // Manual status tracking
    return null;
  }

  supportsRealtimeSync(): boolean {
    return false;
  }

  getRecommendedSyncSchedule(): 'realtime' | 'hourly' | 'daily' | 'weekly' | 'manual' {
    return 'manual';
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

    if (product.quantity < 0) {
      errors.push('Quantity cannot be negative');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

