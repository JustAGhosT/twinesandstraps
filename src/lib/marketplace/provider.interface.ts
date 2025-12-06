/**
 * Marketplace Provider Interface
 * Defines contract for marketplace integrations (Takealot, Google Shopping, Facebook, etc.)
 */

export interface MarketplaceProduct {
  id: string; // Our internal product ID
  sellerSku?: string; // Marketplace-specific SKU
  title: string;
  description: string;
  price: number;
  currency: string;
  quantity: number;
  categoryId?: string;
  brand?: string;
  images: string[];
  attributes?: Record<string, string>;
  condition?: 'new' | 'used' | 'refurbished';
}

export interface MarketplaceOrder {
  orderId: string;
  marketplaceOrderId: string;
  orderDate: Date;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  items: Array<{
    sellerSku: string;
    quantity: number;
    price: number;
  }>;
  shippingAddress: {
    name: string;
    address: string;
    city: string;
    province: string;
    postalCode: string;
    phone: string;
    email?: string;
  };
  total: number;
  currency: string;
}

export interface InventoryUpdate {
  sellerSku: string;
  quantity: number;
}

export interface IMarketplaceProvider {
  /**
   * Provider identifier (e.g., 'takealot', 'google-shopping', 'facebook')
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
   * Create or update a product listing on the marketplace.
   */
  createOrUpdateProduct(product: MarketplaceProduct): Promise<{
    success: boolean;
    sellerSku?: string;
    error?: string;
  }>;

  /**
   * Delete a product listing from the marketplace.
   */
  deleteProduct(sellerSku: string): Promise<{
    success: boolean;
    error?: string;
  }>;

  /**
   * Update inventory/stock levels for a product.
   */
  updateInventory(updates: InventoryUpdate[]): Promise<{
    success: boolean;
    errors?: Array<{ sellerSku: string; error: string }>;
  }>;

  /**
   * Get orders from the marketplace.
   */
  getOrders(filters?: {
    status?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<MarketplaceOrder[]>;

  /**
   * Fulfill an order (mark as shipped with tracking).
   */
  fulfillOrder(
    marketplaceOrderId: string,
    trackingNumber: string,
    carrier?: string
  ): Promise<{
    success: boolean;
    error?: string;
  }>;

  /**
   * Generate product feed (XML, CSV, or JSON) for the marketplace.
   */
  generateFeed(products: MarketplaceProduct[]): Promise<string>;

  /**
   * Get feed format supported by this marketplace.
   */
  getFeedFormat(): 'xml' | 'csv' | 'json';

  /**
   * Get supported product categories.
   */
  getSupportedCategories?(): Promise<Array<{ id: string; name: string; parentId?: string }>>;

  /**
   * Validate product data before submission.
   */
  validateProduct(product: MarketplaceProduct): {
    valid: boolean;
    errors: string[];
  };
}

