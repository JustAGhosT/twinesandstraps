/**
 * Accounting Provider Factory
 * Manages accounting provider registration and selection
 */

import { IAccountingProvider } from './provider.interface';
import { XeroProvider } from './providers/xero.provider';
import { QuickBooksProvider } from './providers/quickbooks.provider';
import { MockAccountingProvider } from './providers/mock.provider';

class AccountingProviderFactory {
  private providers: Map<string, IAccountingProvider> = new Map();
  private defaultProvider: string = 'xero';

  constructor() {
    // Register all available providers
    this.registerProvider(new XeroProvider());
    this.registerProvider(new QuickBooksProvider());
    
    // Register mock provider only in development/test environments
    if (process.env.NODE_ENV === 'development' || process.env.ENABLE_MOCK_PROVIDERS === 'true') {
      this.registerProvider(new MockAccountingProvider());
    }
  }

  /**
   * Register an accounting provider
   */
  registerProvider(provider: IAccountingProvider): void {
    this.providers.set(provider.name, provider);
  }

  /**
   * Get a provider by name
   */
  getProvider(name: string): IAccountingProvider | null {
    return this.providers.get(name) || null;
  }

  /**
   * Get all available providers
   */
  getAllProviders(): IAccountingProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Get all configured providers
   */
  getConfiguredProviders(): IAccountingProvider[] {
    return this.getAllProviders().filter(p => p.isConfigured());
  }

  /**
   * Get default provider
   */
  async getDefaultProvider(): Promise<IAccountingProvider | null> {
    const provider = this.providers.get(this.defaultProvider);
    if (provider && provider.isConfigured()) {
      const isConnected = await provider.isConnected();
      if (isConnected) {
        return provider;
      }
    }

    // Fallback to first configured and connected provider
    const configured = this.getConfiguredProviders();
    for (const p of configured) {
      if (await p.isConnected()) {
        return p;
      }
    }

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
export const accountingProviderFactory = new AccountingProviderFactory();

// Export convenience functions
export async function getAccountingProvider(name?: string): Promise<IAccountingProvider | null> {
  if (name) {
    return accountingProviderFactory.getProvider(name);
  }
  return accountingProviderFactory.getDefaultProvider();
}

export function getAllAccountingProviders(): IAccountingProvider[] {
  return accountingProviderFactory.getAllProviders();
}

export function getConfiguredAccountingProviders(): IAccountingProvider[] {
  return accountingProviderFactory.getConfiguredProviders();
}

