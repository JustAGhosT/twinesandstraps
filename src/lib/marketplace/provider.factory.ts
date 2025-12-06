/**
 * Marketplace Provider Factory
 * Manages marketplace provider registration and selection
 */

import { IMarketplaceProvider } from './provider.interface';
import { TakealotProvider } from './providers/takealot.provider';
import { GoogleShoppingProvider } from './providers/google-shopping.provider';
import { FacebookProvider } from './providers/facebook.provider';
import { MockMarketplaceProvider } from './providers/mock.provider';

class MarketplaceProviderFactory {
  private providers: Map<string, IMarketplaceProvider> = new Map();
  private defaultProvider: string = 'takealot';

  constructor() {
    // Register all available providers
    this.registerProvider(new TakealotProvider());
    this.registerProvider(new GoogleShoppingProvider());
    this.registerProvider(new FacebookProvider());
    
    // Register mock provider only in development/test environments
    if (process.env.NODE_ENV === 'development' || process.env.ENABLE_MOCK_PROVIDERS === 'true') {
      this.registerProvider(new MockMarketplaceProvider());
    }
  }

  /**
   * Register a marketplace provider
   */
  registerProvider(provider: IMarketplaceProvider): void {
    this.providers.set(provider.name, provider);
  }

  /**
   * Get a provider by name
   */
  getProvider(name: string): IMarketplaceProvider | null {
    const provider = this.providers.get(name);
    if (provider && provider.isConfigured()) {
      return provider;
    }
    // Fallback to mock in development if specific provider not configured
    if (process.env.NODE_ENV === 'development' && name !== 'mock') {
      const mockProvider = this.providers.get('mock');
      if (mockProvider?.isConfigured()) {
        console.warn(`Marketplace provider '${name}' not configured. Using MockMarketplaceProvider.`);
        return mockProvider;
      }
    }
    return null;
  }

  /**
   * Get all available providers
   */
  getAllProviders(): IMarketplaceProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Get all configured providers
   */
  getConfiguredProviders(): IMarketplaceProvider[] {
    return this.getAllProviders().filter(p => p.isConfigured());
  }

  /**
   * Get default provider
   */
  getDefaultProvider(): IMarketplaceProvider | null {
    const provider = this.providers.get(this.defaultProvider);
    if (provider && provider.isConfigured()) {
      return provider;
    }

    // Fallback to first configured provider
    const configured = this.getConfiguredProviders();
    return configured.length > 0 ? configured[0] : null;
  }

  /**
   * Set default provider
   */
  setDefaultProvider(name: string): void {
    if (this.providers.has(name)) {
      this.defaultProvider = name;
    }
  }
}

// Export singleton instance
export const marketplaceProviderFactory = new MarketplaceProviderFactory();

// Export convenience functions
export function getMarketplaceProvider(name?: string): IMarketplaceProvider | null {
  if (name) {
    return marketplaceProviderFactory.getProvider(name);
  }
  return marketplaceProviderFactory.getDefaultProvider();
}

export function getAllMarketplaceProviders(): IMarketplaceProvider[] {
  return marketplaceProviderFactory.getAllProviders();
}

export function getConfiguredMarketplaceProviders(): IMarketplaceProvider[] {
  return marketplaceProviderFactory.getConfiguredProviders();
}

