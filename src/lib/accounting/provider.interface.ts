/**
 * Accounting Provider Interface
 * All accounting providers must implement this interface
 */

export interface InvoiceRequest {
  orderId: string;
  orderNumber: string;
  customer: {
    name: string;
    email?: string;
    phone?: string;
    address?: {
      street: string;
      city: string;
      province: string;
      postalCode: string;
      country: string;
    };
  };
  items: Array<{
    name: string;
    description?: string;
    quantity: number;
    unitPrice: number;
    taxRate?: number;
    accountCode?: string;
  }>;
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  invoiceDate: Date;
  dueDate?: Date;
  reference?: string;
  notes?: string;
}

export interface InvoiceResult {
  success: boolean;
  invoiceId?: string;
  invoiceNumber?: string;
  invoiceUrl?: string;
  error?: string;
}

export interface PaymentRequest {
  invoiceId: string;
  amount: number;
  paymentDate: Date;
  paymentMethod?: string;
  reference?: string;
  accountCode?: string;
}

export interface PaymentResult {
  success: boolean;
  paymentId?: string;
  error?: string;
}

export interface ContactRequest {
  name: string;
  email?: string;
  phone?: string;
  address?: {
    street: string;
    city: string;
    province: string;
    postalCode: string;
    country: string;
  };
  isCustomer?: boolean;
  isSupplier?: boolean;
}

export interface ContactResult {
  success: boolean;
  contactId?: string;
  error?: string;
}

export interface IAccountingProvider {
  /**
   * Provider identifier (e.g., 'xero', 'quickbooks', 'sage')
   */
  readonly name: string;

  /**
   * Human-readable provider name
   */
  readonly displayName: string;

  /**
   * Check if provider is configured and available
   */
  isConfigured(): boolean;

  /**
   * Check if provider is connected (OAuth authenticated)
   */
  isConnected(): Promise<boolean>;

  /**
   * Get OAuth authorization URL (if OAuth-based)
   */
  getAuthorizationUrl(redirectUri: string, state?: string): Promise<string>;

  /**
   * Handle OAuth callback
   */
  handleCallback(code: string, state?: string): Promise<{
    success: boolean;
    error?: string;
  }>;

  /**
   * Create invoice from order
   */
  createInvoice(request: InvoiceRequest): Promise<InvoiceResult>;

  /**
   * Record payment against invoice
   */
  recordPayment(request: PaymentRequest): Promise<PaymentResult>;

  /**
   * Create or update contact (customer/supplier)
   */
  createOrUpdateContact(request: ContactRequest): Promise<ContactResult>;

  /**
   * Get invoice by ID
   */
  getInvoice(invoiceId: string): Promise<{
    invoiceId: string;
    invoiceNumber?: string;
    status: string;
    amount: number;
    amountDue: number;
    invoiceUrl?: string;
  } | null>;

  /**
   * Get supported currencies
   */
  getSupportedCurrencies(): string[];

  /**
   * Get default tax rates
   */
  getDefaultTaxRates(): Array<{
    name: string;
    rate: number;
    code?: string;
  }>;
}

