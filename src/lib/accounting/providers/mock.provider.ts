/**
 * Mock Accounting Provider
 * For testing and development purposes
 */

import { IAccountingProvider, InvoiceRequest, InvoiceResult, PaymentRequest, PaymentResult, ContactRequest, ContactResult } from '../provider.interface';

import { logInfo, logError, logWarn, logDebug } from '@/lib/logging/logger';

export class MockAccountingProvider implements IAccountingProvider {
  readonly name = 'mock';
  readonly displayName = 'Mock Accounting Provider';

  private mockInvoices: Map<string, { invoiceId: string; invoiceNumber: string; amount: number; amountDue: number }> = new Map();
  private mockContacts: Map<string, string> = new Map();
  private invoiceCounter = 1;

  isConfigured(): boolean {
    return true; // Always available for testing
  }

  async isConnected(): Promise<boolean> {
    return true; // Always connected in mock
  }

  async getAuthorizationUrl(redirectUri: string, state?: string): Promise<string> {
    // Mock OAuth URL
    return `/api/accounting/mock/auth?redirect_uri=${encodeURIComponent(redirectUri)}${state ? `&state=${state}` : ''}`;
  }

  async handleCallback(code: string, state?: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    // Mock always succeeds
    return { success: true };
  }

  async createInvoice(request: InvoiceRequest): Promise<InvoiceResult> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));

    const invoiceId = `MOCK-INV-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    const invoiceNumber = `INV-${String(this.invoiceCounter++).padStart(6, '0')}`;

    // Store mock invoice
    this.mockInvoices.set(invoiceId, {
      invoiceId,
      invoiceNumber,
      amount: request.total,
      amountDue: request.total,
    });

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      logInfo('📊 [MOCK ACCOUNTING] Invoice Created', {
        invoiceId,
        invoiceNumber,
        orderNumber: request.orderNumber,
        customer: request.customer.name,
        total: request.total,
      });
    }

    return {
      success: true,
      invoiceId,
      invoiceNumber,
      invoiceUrl: `/accounting/invoices/${invoiceId}`,
    };
  }

  async recordPayment(request: PaymentRequest): Promise<PaymentResult> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));

    const mockInvoice = this.mockInvoices.get(request.invoiceId);
    if (!mockInvoice) {
      return {
        success: false,
        error: 'Invoice not found',
      };
    }

    // Update amount due
    mockInvoice.amountDue = Math.max(0, mockInvoice.amountDue - request.amount);

    const paymentId = `MOCK-PAY-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      logInfo('💰 [MOCK ACCOUNTING] Payment Recorded', {
        paymentId,
        invoiceId: request.invoiceId,
        amount: request.amount,
        remainingDue: mockInvoice.amountDue,
      });
    }

    return {
      success: true,
      paymentId,
    };
  }

  async createOrUpdateContact(request: ContactRequest): Promise<ContactResult> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 50));

    let contactId = this.mockContacts.get(request.name);
    if (!contactId) {
      contactId = `MOCK-CONTACT-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      this.mockContacts.set(request.name, contactId);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      logInfo('👤 [MOCK ACCOUNTING] Contact Created/Updated', {
        contactId,
        name: request.name,
        email: request.email,
        isCustomer: request.isCustomer,
        isSupplier: request.isSupplier,
      });
    }

    return {
      success: true,
      contactId,
    };
  }

  async getInvoice(invoiceId: string): Promise<{
    invoiceId: string;
    invoiceNumber?: string;
    status: string;
    amount: number;
    amountDue: number;
    invoiceUrl?: string;
  } | null> {
    const mockInvoice = this.mockInvoices.get(invoiceId);
    if (!mockInvoice) {
      return null;
    }

    return {
      invoiceId: mockInvoice.invoiceId,
      invoiceNumber: mockInvoice.invoiceNumber,
      status: mockInvoice.amountDue === 0 ? 'PAID' : 'AUTHORISED',
      amount: mockInvoice.amount,
      amountDue: mockInvoice.amountDue,
      invoiceUrl: `/accounting/invoices/${invoiceId}`,
    };
  }

  getSupportedCurrencies(): string[] {
    return ['ZAR', 'USD', 'EUR', 'GBP'];
  }

  getDefaultTaxRates(): Array<{
    name: string;
    rate: number;
    code?: string;
  }> {
    return [
      {
        name: 'VAT (15%)',
        rate: 15,
        code: 'VAT',
      },
      {
        name: 'Zero Rated',
        rate: 0,
        code: 'ZERO',
      },
    ];
  }

  // Helper methods for testing
  getMockInvoices(): Map<string, any> {
    return new Map(this.mockInvoices);
  }

  clearMockData(): void {
    this.mockInvoices.clear();
    this.mockContacts.clear();
    this.invoiceCounter = 1;
  }
}

