/**
 * EDI Supplier Provider
 * Handles supplier data from EDI (Electronic Data Interchange) files
 * Supports common EDI formats: X12, EDIFACT, etc.
 */

import { ISupplierProvider, SupplierProduct, SupplierOrder } from '../provider.interface';
import { logInfo, logError, logWarn } from '@/lib/logging/logger';

export interface EdiSupplierConfig {
  ediData?: string; // Raw EDI data
  ediUrl?: string; // URL to fetch EDI from
  format?: 'X12' | 'EDIFACT' | 'TRADACOMS'; // EDI format
  documentType?: '856' | '846' | '810'; // X12 document types (856=ASN, 846=Inventory, 810=Invoice)
  syncSchedule?: 'manual' | 'daily' | 'weekly';
  lastSyncAt?: Date;
}

export class EdiSupplierProvider implements ISupplierProvider {
  readonly name = 'edi';
  readonly displayName = 'EDI Supplier';
  
  private config: EdiSupplierConfig;

  constructor(config: EdiSupplierConfig = {}) {
    this.config = {
      format: 'X12',
      documentType: '846', // Inventory Inquiry/Advice by default
      ...config,
    };
  }

  isConfigured(): boolean {
    return !!(this.config.ediData || this.config.ediUrl);
  }

  /**
   * Parse X12 EDI format
   */
  private parseX12(ediData: string): any {
    // X12 uses segment terminators (usually ~) and element separators (usually *)
    const segments = ediData.split('~').filter(s => s.trim());
    const parsed: any = {
      segments: [],
      products: [],
    };

    for (const segment of segments) {
      const elements = segment.split('*');
      const segmentId = elements[0];
      
      parsed.segments.push({
        id: segmentId,
        elements,
      });

      // Parse 846 (Inventory Inquiry/Advice) segments
      if (segmentId === 'LIN' && this.config.documentType === '846') {
        // LIN - Line Item
        const sku = elements[3] || elements[4]; // Product/Service ID
        const quantity = parseFloat(elements[2] || '0');
        
        // Find associated pricing from PRI segment
        const price = this.findPriceForSku(parsed.segments, sku);
        
        if (sku) {
          parsed.products.push({
            supplier_sku: sku,
            stock_quantity: quantity,
            price: price || 0,
          });
        }
      }
    }

    return parsed;
  }

  /**
   * Find price for SKU from PRI segments
   */
  private findPriceForSku(segments: any[], sku: string): number | null {
    for (const segment of segments) {
      if (segment.id === 'PRI' && segment.elements[1] === sku) {
        return parseFloat(segment.elements[2] || '0');
      }
    }
    return null;
  }

  /**
   * Parse EDIFACT format
   */
  private parseEdifact(ediData: string): any {
    // EDIFACT uses different segment terminators
    // This is a simplified parser - full EDI parsing is complex
    logWarn('EDIFACT parsing is simplified - full implementation required for production');
    
    const segments = ediData.split("'").filter(s => s.trim());
    const parsed: any = {
      segments: [],
      products: [],
    };

    // Simplified EDIFACT parsing
    for (const segment of segments) {
      const elements = segment.split('+');
      const segmentId = elements[0];
      
      if (segmentId === 'LIN' && elements.length > 2) {
        // Line item
        const sku = elements[3];
        const quantity = parseFloat(elements[2] || '0');
        
        if (sku) {
          parsed.products.push({
            supplier_sku: sku,
            stock_quantity: quantity,
            price: 0, // Would need to parse from PRI segment
          });
        }
      }
    }

    return parsed;
  }

  /**
   * Fetch EDI data from URL or use provided data
   */
  private async fetchEdiData(): Promise<string> {
    if (this.config.ediData) {
      return this.config.ediData;
    }
    
    if (this.config.ediUrl) {
      const response = await fetch(this.config.ediUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch EDI from URL: ${response.statusText}`);
      }
      return await response.text();
    }
    
    throw new Error('No EDI data or URL provided');
  }

  async fetchProducts(filters?: {
    category?: string;
    updatedSince?: Date;
    sku?: string;
  }): Promise<SupplierProduct[]> {
    if (!this.isConfigured()) {
      throw new Error('EDI supplier not configured');
    }

    try {
      const ediData = await this.fetchEdiData();
      let parsed: any;

      switch (this.config.format) {
        case 'X12':
          parsed = this.parseX12(ediData);
          break;
        case 'EDIFACT':
          parsed = this.parseEdifact(ediData);
          break;
        default:
          throw new Error(`Unsupported EDI format: ${this.config.format}`);
      }

      const products: SupplierProduct[] = parsed.products.map((p: any) => ({
        supplierSku: p.supplier_sku || p.supplierSku,
        name: p.name || `Product ${p.supplier_sku || p.supplierSku}`,
        description: p.description,
        price: p.price || 0,
        currency: 'ZAR',
        quantity: p.stock_quantity || p.quantity || 0,
        category: p.category,
      }));

      let filteredProducts = products;
      
      // Apply filters
      if (filters?.sku) {
        filteredProducts = filteredProducts.filter(p => p.supplierSku === filters.sku);
      }
      if (filters?.category) {
        filteredProducts = filteredProducts.filter(p => p.category === filters.category);
      }
      
      logInfo(`Parsed ${filteredProducts.length} products from EDI`);
      return filteredProducts;
    } catch (error) {
      logError('Failed to fetch products from EDI', error);
      throw error;
    }
  }

  async getProduct(supplierSku: string): Promise<SupplierProduct | null> {
    const products = await this.fetchProducts({ sku: supplierSku });
    return products[0] || null;
  }

  async getInventory(supplierSkus?: string[]): Promise<Map<string, number>> {
    const products = await this.fetchProducts();
    const inventory = new Map<string, number>();
    
    products
      .filter(p => !supplierSkus || supplierSkus.includes(p.supplierSku))
      .forEach(p => {
        inventory.set(p.supplierSku, p.quantity);
      });
    
    return inventory;
  }

  async getPricing(supplierSkus?: string[]): Promise<Map<string, number>> {
    const products = await this.fetchProducts();
    const pricing = new Map<string, number>();
    
    products
      .filter(p => !supplierSkus || supplierSkus.includes(p.supplierSku))
      .forEach(p => {
        pricing.set(p.supplierSku, p.price);
      });
    
    return pricing;
  }

  async placeOrder(order: SupplierOrder): Promise<{
    success: boolean;
    supplierOrderId?: string;
    estimatedDelivery?: Date;
    error?: string;
  }> {
    // EDI suppliers can support automated ordering via EDI 850 (Purchase Order)
    logWarn('EDI order placement requires EDI 850 document generation');
    return {
      success: false,
      error: 'EDI order placement not yet implemented',
    };
  }

  async getOrderStatus(supplierOrderId: string): Promise<{
    status: string;
    trackingNumber?: string;
    estimatedDelivery?: Date;
  } | null> {
    // Would parse EDI 856 (ASN - Advance Ship Notice) for order status
    return null;
  }

  supportsRealtimeSync(): boolean {
    return false;
  }

  getRecommendedSyncSchedule(): 'realtime' | 'hourly' | 'daily' | 'weekly' | 'manual' {
    return this.config.syncSchedule || 'daily';
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

