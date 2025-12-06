/**
 * Payment Provider Factory
 * Manages payment provider registration and selection
 */

import { IPaymentProvider } from './provider.interface';
import { PayFastProvider } from './providers/payfast.provider';
import { PayStackProvider } from './providers/paystack.provider';
import { MockPaymentProvider } from './providers/mock.provider';

class PaymentProviderFactory {
  private providers: Map<string, IPaymentProvider> = new Map();
  private defaultProvider: string = 'payfast';

  constructor() {
    // Register all available providers
    this.registerProvider(new PayFastProvider());
    this.registerProvider(new PayStackProvider());
    
    // Register mock provider only in development/test environments
    if (process.env.NODE_ENV === 'development' || process.env.ENABLE_MOCK_PROVIDERS === 'true') {
      this.registerProvider(new MockPaymentProvider());
    }
  }

  /**
   * Register a payment provider
   */
  registerProvider(provider: IPaymentProvider): void {
    this.providers.set(provider.name, provider);
  }

  /**
   * Get a provider by name
   */
  getProvider(name: string): IPaymentProvider | null {
    return this.providers.get(name) || null;
  }

  /**
   * Get all available providers
   */
  getAllProviders(): IPaymentProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Get all configured providers
   */
  getConfiguredProviders(): IPaymentProvider[] {
    return this.getAllProviders().filter(p => p.isConfigured());
  }

  /**
   * Get default provider
   */
  getDefaultProvider(): IPaymentProvider | null {
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
export const paymentProviderFactory = new PaymentProviderFactory();

// Export convenience functions
export function getPaymentProvider(name?: string): IPaymentProvider | null {
  if (name) {
    return paymentProviderFactory.getProvider(name);
  }
  return paymentProviderFactory.getDefaultProvider();
}

export function getAllPaymentProviders(): IPaymentProvider[] {
  return paymentProviderFactory.getAllProviders();
}

export function getConfiguredPaymentProviders(): IPaymentProvider[] {
  return paymentProviderFactory.getConfiguredProviders();
}

