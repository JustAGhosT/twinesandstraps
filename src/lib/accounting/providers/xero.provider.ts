/**
 * Xero Accounting Provider
 * Implements IAccountingProvider interface
 */

import { IAccountingProvider, InvoiceRequest, InvoiceResult, PaymentRequest, PaymentResult, ContactRequest, ContactResult } from '../provider.interface';
import { getActiveXeroToken } from '../../xero/token-storage';
import { syncOrderToXero } from '../../xero/invoices';
import { createXeroPayment, syncPaymentToXero } from '../../xero/payments';
import prisma from '../../prisma';

export class XeroProvider implements IAccountingProvider {
  readonly name = 'xero';
  readonly displayName = 'Xero';

  isConfigured(): boolean {
    return !!(
      process.env.XERO_CLIENT_ID &&
      process.env.XERO_CLIENT_SECRET &&
      process.env.XERO_TENANT_ID
    );
  }

  async isConnected(): Promise<boolean> {
    if (!this.isConfigured()) {
      return false;
    }

    try {
      const token = await getActiveXeroToken();
      return !!token;
    } catch (error) {
      return false;
    }
  }

  async getAuthorizationUrl(redirectUri: string, state?: string): Promise<string> {
    // Xero OAuth is handled via the existing /api/xero/auth endpoint
    // This method returns the URL to initiate OAuth
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || '';
    return `${baseUrl}/api/xero/auth?redirect_uri=${encodeURIComponent(redirectUri)}${state ? `&state=${state}` : ''}`;
  }

  async handleCallback(code: string, state?: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    // Xero callback is handled via /api/xero/callback
    // This is a placeholder - actual implementation is in the route handler
    try {
      // The callback route handler should be called instead
      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to handle callback',
      };
    }
  }

  async createInvoice(request: InvoiceRequest): Promise<InvoiceResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'Xero is not configured',
      };
    }

    const isConnected = await this.isConnected();
    if (!isConnected) {
      return {
        success: false,
        error: 'Xero is not connected. Please connect your Xero account first.',
      };
    }

    try {
      const token = await getActiveXeroToken();
      if (!token) {
        return {
          success: false,
          error: 'Xero token not available',
        };
      }

      // Find order in database
      const order = await prisma.order.findUnique({
        where: { order_number: request.orderNumber },
        include: {
          user: true,
          items: {
            include: {
              product: true,
            },
          },
          shipping_address: true,
        },
      });

      if (!order) {
        return {
          success: false,
          error: 'Order not found',
        };
      }

      // Use existing syncOrderToXero function
      const xeroInvoiceId = await syncOrderToXero(token, {
        orderNumber: order.order_number,
        customerName: order.user?.name || request.customer.name,
        customerEmail: order.user?.email || request.customer.email,
        customerPhone: order.user?.phone || request.customer.phone,
        shippingAddress: order.shipping_address ? {
          street_address: order.shipping_address.street_address,
          city: order.shipping_address.city,
          province: order.shipping_address.province,
          postal_code: order.shipping_address.postal_code,
        } : undefined,
        items: order.items.map(item => ({
          name: item.product_name,
          quantity: item.quantity,
          unitPrice: item.unit_price,
        })),
        total: order.total,
        tax: order.tax || 0,
        orderDate: order.created_at,
      });

      // Get invoice mapping
      const mapping = await prisma.xeroInvoiceMapping.findUnique({
        where: { order_id: order.id },
      });

      return {
        success: true,
        invoiceId: xeroInvoiceId,
        invoiceNumber: mapping?.xero_invoice_number,
        invoiceUrl: `https://go.xero.com/AccountsReceivable/View.aspx?InvoiceID=${xeroInvoiceId}`,
      };
    } catch (error) {
      console.error('Xero invoice creation error:', error);
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
        error: 'Xero is not configured',
      };
    }

    const isConnected = await this.isConnected();
    if (!isConnected) {
      return {
        success: false,
        error: 'Xero is not connected',
      };
    }

    try {
      // Find order by invoice ID
      const mapping = await prisma.xeroInvoiceMapping.findFirst({
        where: { xero_invoice_id: request.invoiceId },
        include: { order: true },
      });

      if (!mapping) {
        return {
          success: false,
          error: 'Invoice mapping not found',
        };
      }

      // Use existing syncPaymentToXero function
      const paymentId = await syncPaymentToXero(
        mapping.order_id,
        request.amount,
        request.paymentDate,
        request.reference || ''
      );

      if (!paymentId) {
        return {
          success: false,
          error: 'Failed to create payment',
        };
      }

      return {
        success: true,
        paymentId,
      };
    } catch (error) {
      console.error('Xero payment recording error:', error);
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
        error: 'Xero is not configured',
      };
    }

    const isConnected = await this.isConnected();
    if (!isConnected) {
      return {
        success: false,
        error: 'Xero is not connected',
      };
    }

    try {
      const token = await getActiveXeroToken();
      if (!token) {
        return {
          success: false,
          error: 'Xero token not available',
        };
      }

      const tenantId = process.env.XERO_TENANT_ID || '';

      // Check if contact exists
      const searchResponse = await fetch(
        `https://api.xero.com/api.xro/2.0/Contacts?where=Name="${encodeURIComponent(request.name)}"`,
        {
          headers: {
            Authorization: `Bearer ${token.accessToken}`,
            'Xero-tenant-id': tenantId,
          },
        }
      );

      let contactId: string | undefined;

      if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        if (searchData.Contacts && searchData.Contacts.length > 0) {
          contactId = searchData.Contacts[0].ContactID;
        }
      }

      const contactData: any = {
        Name: request.name,
        IsCustomer: request.isCustomer !== false,
        IsSupplier: request.isSupplier || false,
      };

      if (request.email) {
        contactData.EmailAddress = request.email;
      }

      if (request.phone) {
        contactData.Phones = [
          {
            PhoneType: 'MOBILE',
            PhoneNumber: request.phone,
          },
        ];
      }

      if (request.address) {
        contactData.Addresses = [
          {
            AddressType: 'STREET',
            AddressLine1: request.address.street,
            City: request.address.city,
            Region: request.address.province,
            PostalCode: request.address.postalCode,
            Country: request.address.country || 'South Africa',
          },
        ];
      }

      const url = contactId
        ? `https://api.xero.com/api.xro/2.0/Contacts/${contactId}`
        : 'https://api.xero.com/api.xro/2.0/Contacts';

      const method = contactId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token.accessToken}`,
          'Xero-tenant-id': tenantId,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ Contacts: [contactData] }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to create/update contact: ${error}`);
      }

      const data = await response.json();
      const contact = data.Contacts?.[0];

      return {
        success: true,
        contactId: contact?.ContactID || contactId,
      };
    } catch (error) {
      console.error('Xero contact creation error:', error);
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

    const isConnected = await this.isConnected();
    if (!isConnected) {
      return null;
    }

    try {
      const token = await getActiveXeroToken();
      if (!token) {
        return null;
      }

      const tenantId = process.env.XERO_TENANT_ID || '';

      const response = await fetch(
        `https://api.xero.com/api.xro/2.0/Invoices/${invoiceId}`,
        {
          headers: {
            Authorization: `Bearer ${token.accessToken}`,
            'Xero-tenant-id': tenantId,
          },
        }
      );

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      const invoice = data.Invoices?.[0];

      if (!invoice) {
        return null;
      }

      return {
        invoiceId: invoice.InvoiceID,
        invoiceNumber: invoice.InvoiceNumber,
        status: invoice.Status,
        amount: invoice.Total || 0,
        amountDue: invoice.AmountDue || 0,
        invoiceUrl: `https://go.xero.com/AccountsReceivable/View.aspx?InvoiceID=${invoice.InvoiceID}`,
      };
    } catch (error) {
      console.error('Xero get invoice error:', error);
      return null;
    }
  }

  getSupportedCurrencies(): string[] {
    return ['ZAR', 'USD', 'EUR', 'GBP']; // Xero supports many currencies
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
      {
        name: 'Exempt',
        rate: 0,
        code: 'EXEMPT',
      },
    ];
  }
}

