/**
 * Shipping Provider Factory
 * Manages provider registration and selection
 */

import { IShippingProvider } from './provider.interface';
import { CourierGuyProvider } from './providers/courier-guy.provider';
import { PargoProvider } from './providers/pargo.provider';
import { ShippingQuoteRequest, ShippingQuote } from './types';

type ProviderName = 'courier-guy' | 'pargo' | 'auto';

class ShippingProviderFactory {
  private providers: Map<string, IShippingProvider> = new Map();
  private defaultProvider: string = 'courier-guy';

  constructor() {
    // Register all available providers
    this.registerProvider(new CourierGuyProvider());
    this.registerProvider(new PargoProvider());
  }

  /**
   * Register a shipping provider
   */
  registerProvider(provider: IShippingProvider): void {
    this.providers.set(provider.name, provider);
  }

  /**
   * Get a provider by name
   */
  getProvider(name: string): IShippingProvider | null {
    return this.providers.get(name) || null;
  }

  /**
   * Get all available providers
   */
  getAllProviders(): IShippingProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Get all configured providers
   */
  getConfiguredProviders(): IShippingProvider[] {
    return this.getAllProviders().filter(p => p.isConfigured());
  }

  /**
   * Set default provider
   */
  setDefaultProvider(name: string): void {
    if (this.providers.has(name)) {
      this.defaultProvider = name;
    }
  }

  /**
   * Get default provider
   */
  getDefaultProvider(): IShippingProvider | null {
    return this.providers.get(this.defaultProvider) || null;
  }

  /**
   * Get quotes from all configured providers
   */
  async getAllQuotes(request: ShippingQuoteRequest): Promise<ShippingQuote[]> {
    const providers = this.getConfiguredProviders();
    const quotes: ShippingQuote[] = [];

    // Filter providers by weight limit
    const validProviders = providers.filter(p => request.weight <= p.getMaxWeight());

    // Filter by service type if specified
    const serviceTypeProviders = request.serviceType
      ? validProviders.filter(p => p.getSupportedServiceTypes().includes(request.serviceType!))
      : validProviders;

    // Get quotes from all valid providers in parallel
    const quotePromises = serviceTypeProviders.map(async (provider) => {
      try {
        const quote = await provider.getQuote(request);
        return quote;
      } catch (error) {
        console.error(`Error getting quote from ${provider.name}:`, error);
        return null;
      }
    });

    const results = await Promise.all(quotePromises);
    
    return results.filter((quote): quote is ShippingQuote => quote !== null);
  }

  /**
   * Get best quote (cheapest or fastest based on preference)
   */
  async getBestQuote(
    request: ShippingQuoteRequest,
    preference: 'cheapest' | 'fastest' = 'cheapest'
  ): Promise<ShippingQuote | null> {
    const quotes = await this.getAllQuotes(request);
    
    if (quotes.length === 0) {
      return null;
    }

    if (preference === 'cheapest') {
      return quotes.reduce((best, current) => 
        current.cost < best.cost ? current : best
      );
    } else {
      return quotes.reduce((best, current) => 
        current.estimatedDays < best.estimatedDays ? current : best
      );
    }
  }

  /**
   * Auto-select provider based on request characteristics
   */
  async getAutoProvider(request: ShippingQuoteRequest): Promise<IShippingProvider | null> {
    const configuredProviders = this.getConfiguredProviders();

    // If weight exceeds Pargo limit, use Courier Guy
    const pargoProvider = configuredProviders.find(p => p.name === 'pargo');
    const courierGuyProvider = configuredProviders.find(p => p.name === 'courier-guy');

    if (request.weight > 20 && courierGuyProvider) {
      return courierGuyProvider;
    }

    // If collection point specified, use Pargo
    if (request.collectionPointId && pargoProvider) {
      return pargoProvider;
    }

    // Default to Courier Guy for door-to-door
    return courierGuyProvider || configuredProviders[0] || null;
  }
}

// Export singleton instance
export const shippingProviderFactory = new ShippingProviderFactory();

// Export convenience functions
export function getShippingProvider(name: string): IShippingProvider | null {
  return shippingProviderFactory.getProvider(name);
}

export function getAllShippingProviders(): IShippingProvider[] {
  return shippingProviderFactory.getAllProviders();
}

export function getConfiguredShippingProviders(): IShippingProvider[] {
  return shippingProviderFactory.getConfiguredProviders();
}

export async function getAllShippingQuotes(request: ShippingQuoteRequest): Promise<ShippingQuote[]> {
  return shippingProviderFactory.getAllQuotes(request);
}

export async function getBestShippingQuote(
  request: ShippingQuoteRequest,
  preference: 'cheapest' | 'fastest' = 'cheapest'
): Promise<ShippingQuote | null> {
  return shippingProviderFactory.getBestQuote(request, preference);
}

