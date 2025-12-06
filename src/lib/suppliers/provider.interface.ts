/**
 * Supplier Provider Interface
 * Defines contract for supplier integrations (API, CSV, EDI, etc.)
 */

export interface SupplierProduct {
  supplierSku: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  quantity: number;
  category?: string;
  brand?: string;
  images?: string[];
  attributes?: Record<string, string>;
  leadTimeDays?: number;
  minOrderQuantity?: number;
  updatedAt?: Date;
}

export interface SupplierOrder {
  orderId: string;
  supplierOrderId?: string;
  items: Array<{
    supplierSku: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  currency: string;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  estimatedDelivery?: Date;
  trackingNumber?: string;
}

export interface SupplierInventoryUpdate {
  supplierSku: string;
  quantity: number;
  price?: number;
}

export interface ISupplierProvider {
  /**
   * Provider identifier (e.g., 'api', 'csv', 'edi', 'manual')
   */
  readonly name: string;

  /**
   * Human-readable provider name
   */
  readonly displayName: string;

  /**
   * Check if the provider is configured and available.
   */
  isConfigured(): boolean;

  /**
   * Fetch products from supplier.
   */
  fetchProducts(filters?: {
    category?: string;
    updatedSince?: Date;
    sku?: string;
  }): Promise<SupplierProduct[]>;

  /**
   * Get a single product by SKU.
   */
  getProduct(supplierSku: string): Promise<SupplierProduct | null>;

  /**
   * Get current inventory/stock levels.
   */
  getInventory(supplierSkus?: string[]): Promise<Map<string, number>>;

  /**
   * Get pricing information.
   */
  getPricing(supplierSkus?: string[]): Promise<Map<string, number>>;

  /**
   * Place an order with the supplier.
   */
  placeOrder(order: SupplierOrder): Promise<{
    success: boolean;
    supplierOrderId?: string;
    estimatedDelivery?: Date;
    error?: string;
  }>;

  /**
   * Get order status.
   */
  getOrderStatus(supplierOrderId: string): Promise<{
    status: string;
    trackingNumber?: string;
    estimatedDelivery?: Date;
  } | null>;

  /**
   * Check if provider supports real-time sync.
   */
  supportsRealtimeSync(): boolean;

  /**
   * Get recommended sync schedule.
   */
  getRecommendedSyncSchedule(): 'realtime' | 'hourly' | 'daily' | 'weekly' | 'manual';

  /**
   * Validate product data before syncing.
   */
  validateProduct(product: SupplierProduct): {
    valid: boolean;
    errors: string[];
  };
}

