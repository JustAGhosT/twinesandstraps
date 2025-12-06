/**
 * CSV Supplier Provider
 * Handles supplier data from CSV file uploads
 */

import { ISupplierProvider, SupplierProduct, SupplierOrder } from '../provider.interface';
import { logInfo, logError, logWarn } from '@/lib/logging/logger';

export interface CsvSupplierConfig {
  csvData?: string; // Base64 encoded CSV or raw CSV string
  csvUrl?: string; // URL to fetch CSV from
  delimiter?: string; // CSV delimiter (default: ',')
  hasHeaders?: boolean; // Whether CSV has header row (default: true)
  columnMapping?: {
    sku?: string; // Column name/index for SKU
    name?: string; // Column name/index for product name
    price?: string; // Column name/index for price
    quantity?: string; // Column name/index for quantity
    description?: string; // Column name/index for description
    category?: string; // Column name/index for category
  };
  syncSchedule?: 'manual' | 'daily' | 'weekly';
  lastSyncAt?: Date;
}

export class CsvSupplierProvider implements ISupplierProvider {
  readonly name = 'csv';
  readonly displayName = 'CSV Supplier';
  
  private config: CsvSupplierConfig;

  constructor(config: CsvSupplierConfig = {}) {
    this.config = {
      delimiter: ',',
      hasHeaders: true,
      ...config,
    };
  }

  isConfigured(): boolean {
    return !!(this.config.csvData || this.config.csvUrl);
  }

  /**
   * Parse CSV data into rows
   */
  private parseCsv(csvData: string): string[][] {
    const lines = csvData.split('\n').filter(line => line.trim());
    const delimiter = this.config.delimiter || ',';
    
    return lines.map(line => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === delimiter && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      
      result.push(current.trim());
      return result;
    });
  }

  /**
   * Get column index or name from mapping
   */
  private getColumnValue(row: string[], headers: string[], columnKey: string | undefined): string | undefined {
    if (!columnKey) return undefined;
    
    // If columnKey is a number, use as index
    const index = parseInt(columnKey);
    if (!isNaN(index)) {
      return row[index];
    }
    
    // Otherwise, find by header name
    const headerIndex = headers.indexOf(columnKey);
    if (headerIndex >= 0) {
      return row[headerIndex];
    }
    
    return undefined;
  }

  /**
   * Fetch CSV data from URL or use provided data
   */
  private async fetchCsvData(): Promise<string> {
    if (this.config.csvData) {
      // If base64, decode it
      if (this.config.csvData.startsWith('data:text/csv;base64,')) {
        const base64 = this.config.csvData.split(',')[1];
        return Buffer.from(base64, 'base64').toString('utf-8');
      }
      return this.config.csvData;
    }
    
    if (this.config.csvUrl) {
      const response = await fetch(this.config.csvUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch CSV from URL: ${response.statusText}`);
      }
      return await response.text();
    }
    
    throw new Error('No CSV data or URL provided');
  }

  async fetchProducts(filters?: {
    category?: string;
    updatedSince?: Date;
    sku?: string;
  }): Promise<SupplierProduct[]> {
    if (!this.isConfigured()) {
      throw new Error('CSV supplier not configured');
    }

    try {
      const csvData = await this.fetchCsvData();
      const rows = this.parseCsv(csvData);
      
      if (rows.length === 0) {
        logWarn('CSV file is empty');
        return [];
      }

      const hasHeaders = this.config.hasHeaders ?? true;
      const headers = hasHeaders ? rows[0] : [];
      const dataRows = hasHeaders ? rows.slice(1) : rows;

      const mapping = this.config.columnMapping || {};
      
      const products: SupplierProduct[] = dataRows
        .filter(row => row.some(cell => cell.trim())) // Skip empty rows
        .map((row, index) => {
          const sku = this.getColumnValue(row, headers, mapping.sku) || `CSV-${index}`;
          const name = this.getColumnValue(row, headers, mapping.name) || 'Unknown Product';
          const priceStr = this.getColumnValue(row, headers, mapping.price) || '0';
          const quantityStr = this.getColumnValue(row, headers, mapping.quantity) || '0';
          const description = this.getColumnValue(row, headers, mapping.description);
          const category = this.getColumnValue(row, headers, mapping.category);

          const product: SupplierProduct = {
            supplierSku: sku,
            name,
            description,
            price: parseFloat(priceStr) || 0,
            currency: 'ZAR',
            quantity: parseInt(quantityStr) || 0,
            category,
          };

          // Apply filters
          if (filters?.sku && product.supplierSku !== filters.sku) return null;
          if (filters?.category && product.category !== filters.category) return null;
          
          return product;
        })
        .filter((product): product is SupplierProduct => product !== null && !!product.supplierSku && !!product.name); // Filter out invalid products

      logInfo(`Parsed ${products.length} products from CSV`);
      return products;
    } catch (error) {
      logError('Failed to fetch products from CSV', error);
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
    // CSV suppliers typically don't support automated ordering
    logWarn('CSV supplier does not support automated ordering');
    return {
      success: false,
      error: 'CSV supplier requires manual order processing',
    };
  }

  async getOrderStatus(supplierOrderId: string): Promise<{
    status: string;
    trackingNumber?: string;
    estimatedDelivery?: Date;
  } | null> {
    return null; // CSV suppliers don't support order tracking
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

