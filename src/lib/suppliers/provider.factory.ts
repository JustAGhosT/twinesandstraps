/**
 * Supplier Provider Factory
 * Manages supplier provider registration and selection
 */

import { ISupplierProvider } from './provider.interface';
import { ManualSupplierProvider } from './providers/manual.provider';
import { ApiSupplierProvider } from './providers/api.provider';

class SupplierProviderFactory {
  private providers: Map<string, ISupplierProvider> = new Map();

  constructor() {
    // Register default providers
    this.registerProvider(new ManualSupplierProvider());
  }

  /**
   * Register a supplier provider
   */
  registerProvider(provider: ISupplierProvider): void {
    this.providers.set(provider.name, provider);
  }

  /**
   * Get a provider by name
   */
  getProvider(name: string, config?: { apiUrl?: string; apiKey?: string }): ISupplierProvider | null {
    if (name === 'api' && config) {
      return new ApiSupplierProvider(config.apiUrl, config.apiKey);
    }
    return this.providers.get(name) || null;
  }

  /**
   * Get all available providers
   */
  getAllProviders(): ISupplierProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Get recommended provider for a supplier based on configuration
   */
  getRecommendedProvider(providerType?: string | null): ISupplierProvider {
    if (providerType === 'api') {
      return new ApiSupplierProvider();
    }
    return new ManualSupplierProvider();
  }
}

// Export singleton instance
export const supplierProviderFactory = new SupplierProviderFactory();

// Export convenience functions
export function getSupplierProvider(name: string, config?: { apiUrl?: string; apiKey?: string }): ISupplierProvider | null {
  return supplierProviderFactory.getProvider(name, config);
}

export function getAllSupplierProviders(): ISupplierProvider[] {
  return supplierProviderFactory.getAllProviders();
}

