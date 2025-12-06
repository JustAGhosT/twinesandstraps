/**
 * QuickBooks Accounting Provider
 * Implements IAccountingProvider interface
 */

import { IAccountingProvider, InvoiceRequest, InvoiceResult, PaymentRequest, PaymentResult, ContactRequest, ContactResult } from '../provider.interface';

const QUICKBOOKS_CLIENT_ID = process.env.QUICKBOOKS_CLIENT_ID || '';
const QUICKBOOKS_CLIENT_SECRET = process.env.QUICKBOOKS_CLIENT_SECRET || '';
const QUICKBOOKS_REALM_ID = process.env.QUICKBOOKS_REALM_ID || '';
const QUICKBOOKS_API_URL = 'https://sandbox-quickbooks.api.intuit.com'; // Use production URL in production

export class QuickBooksProvider implements IAccountingProvider {
  readonly name = 'quickbooks';
  readonly displayName = 'QuickBooks';

  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  isConfigured(): boolean {
    return !!(QUICKBOOKS_CLIENT_ID && QUICKBOOKS_CLIENT_SECRET && QUICKBOOKS_REALM_ID);
  }

  async isConnected(): Promise<boolean> {
    if (!this.isConfigured()) {
      return false;
    }

    // Check if we have a valid access token
    if (this.accessToken && this.tokenExpiry && this.tokenExpiry > new Date()) {
      return true;
    }

    // Try to get a new token
    try {
      await this.getAccessToken();
      return !!this.accessToken;
    } catch (error) {
      return false;
    }
  }

  private async getAccessToken(): Promise<string> {
    // QuickBooks uses OAuth 2.0 - this is a simplified version
    // In production, you'd store and refresh tokens properly
    if (this.accessToken && this.tokenExpiry && this.tokenExpiry > new Date()) {
      return this.accessToken;
    }

    // This is a placeholder - actual OAuth flow would be more complex
    throw new Error('QuickBooks OAuth not fully implemented. Please use OAuth flow.');
  }

  async getAuthorizationUrl(redirectUri: string, state?: string): Promise<string> {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || '';
    return `${baseUrl}/api/accounting/quickbooks/auth?redirect_uri=${encodeURIComponent(redirectUri)}${state ? `&state=${state}` : ''}`;
  }

  async handleCallback(code: string, state?: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    // QuickBooks OAuth callback handling
    // This would exchange the code for tokens
    return {
      success: false,
      error: 'QuickBooks OAuth callback not fully implemented',
    };
  }

  async createInvoice(request: InvoiceRequest): Promise<InvoiceResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'QuickBooks is not configured',
      };
    }

    const isConnected = await this.isConnected();
    if (!isConnected) {
      return {
        success: false,
        error: 'QuickBooks is not connected. Please connect your QuickBooks account first.',
      };
    }

    try {
      const accessToken = await this.getAccessToken();

      // Create or get customer
      const customer = await this.createOrUpdateContact({
        name: request.customer.name,
        email: request.customer.email,
        phone: request.customer.phone,
        address: request.customer.address,
        isCustomer: true,
      });

      if (!customer.success || !customer.contactId) {
        return {
          success: false,
          error: 'Failed to create customer',
        };
      }

      // Create invoice
      const invoiceData = {
        Line: request.items.map(item => ({
          Amount: item.unitPrice * item.quantity,
          DetailType: 'SalesItemLineDetail',
          SalesItemLineDetail: {
            ItemRef: {
              value: '1', // Default item - should be mapped properly
            },
            UnitPrice: item.unitPrice,
            Qty: item.quantity,
          },
          Description: item.name,
        })),
        CustomerRef: {
          value: customer.contactId,
        },
        TxnDate: request.invoiceDate.toISOString().split('T')[0],
        DueDate: request.dueDate?.toISOString().split('T')[0] || request.invoiceDate.toISOString().split('T')[0],
        ...(request.reference && { DocNumber: request.reference }),
      };

      const response = await fetch(
        `${QUICKBOOKS_API_URL}/v3/company/${QUICKBOOKS_REALM_ID}/invoice`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify(invoiceData),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.Fault?.Error?.[0]?.Message || 'Failed to create invoice');
      }

      const data = await response.json();
      const invoice = data.QueryResponse?.Invoice?.[0] || data.Invoice;

      return {
        success: true,
        invoiceId: invoice.Id,
        invoiceNumber: invoice.DocNumber,
        invoiceUrl: `https://app.qbo.intuit.com/app/invoice?txnId=${invoice.Id}`,
      };
    } catch (error) {
      console.error('QuickBooks invoice creation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create invoice',
      };
    }
  }

  async recordPayment(request: PaymentRequest): Promise<PaymentResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'QuickBooks is not configured',
      };
    }

    try {
      const accessToken = await this.getAccessToken();

      const paymentData = {
        PaymentRefNum: request.reference,
        TotalAmt: request.amount,
        TxnDate: request.paymentDate.toISOString().split('T')[0],
        CustomerRef: {
          value: '', // Would need to get from invoice
        },
        DepositToAccountRef: {
          value: request.accountCode || '1', // Default account
        },
      };

      const response = await fetch(
        `${QUICKBOOKS_API_URL}/v3/company/${QUICKBOOKS_REALM_ID}/payment`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify(paymentData),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.Fault?.Error?.[0]?.Message || 'Failed to record payment');
      }

      const data = await response.json();
      const payment = data.QueryResponse?.Payment?.[0] || data.Payment;

      return {
        success: true,
        paymentId: payment.Id,
      };
    } catch (error) {
      console.error('QuickBooks payment recording error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to record payment',
      };
    }
  }

  async createOrUpdateContact(request: ContactRequest): Promise<ContactResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'QuickBooks is not configured',
      };
    }

    try {
      const accessToken = await this.getAccessToken();

      const contactData: any = {
        DisplayName: request.name,
        PrimaryEmailAddr: request.email ? { Address: request.email } : undefined,
        PrimaryPhone: request.phone ? { FreeFormNumber: request.phone } : undefined,
      };

      if (request.address) {
        contactData.BillAddr = {
          Line1: request.address.street,
          City: request.address.city,
          CountrySubDivisionCode: request.address.province,
          PostalCode: request.address.postalCode,
          Country: request.address.country || 'ZA',
        };
      }

      const response = await fetch(
        `${QUICKBOOKS_API_URL}/v3/company/${QUICKBOOKS_REALM_ID}/customer`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify(contactData),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.Fault?.Error?.[0]?.Message || 'Failed to create contact');
      }

      const data = await response.json();
      const contact = data.QueryResponse?.Customer?.[0] || data.Customer;

      return {
        success: true,
        contactId: contact.Id,
      };
    } catch (error) {
      console.error('QuickBooks contact creation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create/update contact',
      };
    }
  }

  async getInvoice(invoiceId: string): Promise<{
    invoiceId: string;
    invoiceNumber?: string;
    status: string;
    amount: number;
    amountDue: number;
    invoiceUrl?: string;
  } | null> {
    if (!this.isConfigured()) {
      return null;
    }

    try {
      const accessToken = await this.getAccessToken();

      const response = await fetch(
        `${QUICKBOOKS_API_URL}/v3/company/${QUICKBOOKS_REALM_ID}/invoice/${invoiceId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json',
          },
        }
      );

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      const invoice = data.QueryResponse?.Invoice?.[0] || data.Invoice;

      return {
        invoiceId: invoice.Id,
        invoiceNumber: invoice.DocNumber,
        status: invoice.Balance === 0 ? 'PAID' : 'OPEN',
        amount: invoice.TotalAmt,
        amountDue: invoice.Balance,
        invoiceUrl: `https://app.qbo.intuit.com/app/invoice?txnId=${invoice.Id}`,
      };
    } catch (error) {
      console.error('QuickBooks get invoice error:', error);
      return null;
    }
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
}

