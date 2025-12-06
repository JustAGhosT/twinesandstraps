/**
 * Email Provider Factory
 * Manages email provider registration and selection
 */

import { IEmailProvider } from './provider.interface';
import { MockEmailProvider } from './providers/mock.provider';
import { SendGridProvider } from './providers/sendgrid.provider';
import { BrevoProvider } from './providers/brevo.provider';

class EmailProviderFactory {
  private providers: Map<string, IEmailProvider> = new Map();
  private defaultProvider: string = 'brevo';

  constructor() {
    // Register all available providers
    this.registerProvider(new BrevoProvider());
    this.registerProvider(new SendGridProvider());
    
    // Register mock provider only in development/test environments
    if (process.env.NODE_ENV === 'development' || process.env.ENABLE_MOCK_PROVIDERS === 'true') {
      this.registerProvider(new MockEmailProvider());
      this.defaultProvider = 'mock';
    }
  }

  /**
   * Register an email provider
   */
  registerProvider(provider: IEmailProvider): void {
    this.providers.set(provider.name, provider);
  }

  /**
   * Get a provider by name
   */
  getProvider(name: string): IEmailProvider | null {
    return this.providers.get(name) || null;
  }

  /**
   * Get all available providers
   */
  getAllProviders(): IEmailProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Get all configured providers
   */
  getConfiguredProviders(): IEmailProvider[] {
    return this.getAllProviders().filter(p => p.isConfigured());
  }

  /**
   * Get default provider
   */
  getDefaultProvider(): IEmailProvider | null {
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
export const emailProviderFactory = new EmailProviderFactory();

// Export convenience functions
export function getEmailProvider(name?: string): IEmailProvider | null {
  if (name) {
    return emailProviderFactory.getProvider(name);
  }
  return emailProviderFactory.getDefaultProvider();
}

export function getAllEmailProviders(): IEmailProvider[] {
  return emailProviderFactory.getAllProviders();
}

export function getConfiguredEmailProviders(): IEmailProvider[] {
  return emailProviderFactory.getConfiguredProviders();
}

