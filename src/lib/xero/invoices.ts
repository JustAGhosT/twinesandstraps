/**
 * Xero Invoice Management
 * Sync orders to Xero as invoices
 */

import { XeroToken } from './auth';

export interface XeroContact {
  ContactID?: string;
  Name: string;
  EmailAddress?: string;
  Phones?: Array<{
    PhoneType: string;
    PhoneNumber: string;
  }>;
  Addresses?: Array<{
    AddressType: string;
    AddressLine1: string;
    City: string;
    Region: string;
    PostalCode: string;
    Country: string;
  }>;
}

export interface XeroInvoice {
  Type: 'ACCREC' | 'ACCPAY';
  Contact: XeroContact;
  Date: string; // ISO date string
  DueDate: string; // ISO date string
  LineItems: Array<{
    Description: string;
    Quantity: number;
    UnitAmount: number;
    AccountCode: string; // Xero account code for sales
    TaxType?: string;
  }>;
  Reference?: string;
  Status?: 'DRAFT' | 'SUBMITTED' | 'AUTHORISED';
}

export interface XeroInvoiceResponse {
  Invoices: Array<{
    InvoiceID: string;
    InvoiceNumber: string;
    Status: string;
  }>;
}

/**
 * Get valid Xero access token (refresh if needed)
 */
async function getValidAccessToken(token: XeroToken): Promise<string> {
  // Check if token is expired or about to expire (within 5 minutes)
  if (token.expiresAt.getTime() - Date.now() < 5 * 60 * 1000) {
    // Token needs refresh - this should be handled by the calling function
    // For now, return the existing token
    return token.accessToken;
  }

  return token.accessToken;
}

/**
 * Create or update contact in Xero
 */
export async function createOrUpdateContact(
  token: XeroToken,
  contact: XeroContact
): Promise<string> {
  const accessToken = await getValidAccessToken(token);

  // First, try to find existing contact by email
  if (contact.EmailAddress) {
    const searchResponse = await fetch(
      `https://api.xero.com/api.xro/2.0/Contacts?where=EmailAddress="${contact.EmailAddress}"`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Xero-tenant-id': process.env.XERO_TENANT_ID || '',
        },
      }
    );

    if (searchResponse.ok) {
      const data = await searchResponse.json();
      if (data.Contacts && data.Contacts.length > 0) {
        // Update existing contact
        const contactId = data.Contacts[0].ContactID;
        const updateResponse = await fetch(
          `https://api.xero.com/api.xro/2.0/Contacts/${contactId}`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Xero-tenant-id': process.env.XERO_TENANT_ID || '',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ Contacts: [contact] }),
          }
        );

        if (updateResponse.ok) {
          return contactId;
        }
      }
    }
  }

  // Create new contact
  const response = await fetch('https://api.xero.com/api.xro/2.0/Contacts', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Xero-tenant-id': process.env.XERO_TENANT_ID || '',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ Contacts: [contact] }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create contact: ${error}`);
  }

  const data = await response.json();
  return data.Contacts[0].ContactID;
}

/**
 * Create invoice in Xero
 */
export async function createXeroInvoice(
  token: XeroToken,
  invoice: XeroInvoice
): Promise<XeroInvoiceResponse> {
  const accessToken = await getValidAccessToken(token);

  const response = await fetch('https://api.xero.com/api.xro/2.0/Invoices', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Xero-tenant-id': process.env.XERO_TENANT_ID || '',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ Invoices: [invoice] }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create invoice: ${error}`);
  }

  return response.json();
}

/**
 * Sync order to Xero as invoice
 */
export async function syncOrderToXero(
  token: XeroToken,
  order: {
    orderNumber: string;
    customerName: string;
    customerEmail?: string;
    customerPhone?: string;
    shippingAddress?: {
      street_address: string;
      city: string;
      province: string;
      postal_code: string;
      country: string;
    };
    items: Array<{
      productName: string;
      quantity: number;
      unitPrice: number;
    }>;
    subtotal: number;
    vatAmount: number;
    total: number;
    date: Date;
  }
): Promise<string> {
  // Create or update contact
  const contact: XeroContact = {
    Name: order.customerName,
    EmailAddress: order.customerEmail,
    Phones: order.customerPhone
      ? [{ PhoneType: 'MOBILE', PhoneNumber: order.customerPhone }]
      : undefined,
    Addresses: order.shippingAddress
      ? [
          {
            AddressType: 'STREET',
            AddressLine1: order.shippingAddress.street_address,
            City: order.shippingAddress.city,
            Region: order.shippingAddress.province,
            PostalCode: order.shippingAddress.postal_code,
            Country: order.shippingAddress.country,
          },
        ]
      : undefined,
  };

  const contactId = await createOrUpdateContact(token, contact);

  // Calculate due date (30 days from order date)
  const dueDate = new Date(order.date);
  dueDate.setDate(dueDate.getDate() + 30);

  // Create invoice
  const invoice: XeroInvoice = {
    Type: 'ACCREC', // Accounts Receivable
    Contact: { ContactID: contactId },
    Date: order.date.toISOString().split('T')[0],
    DueDate: dueDate.toISOString().split('T')[0],
    Reference: `Order #${order.orderNumber}`,
    Status: 'AUTHORISED',
    LineItems: [
      ...order.items.map(item => ({
        Description: item.productName,
        Quantity: item.quantity,
        UnitAmount: item.unitPrice,
        AccountCode: process.env.XERO_SALES_ACCOUNT_CODE || '200', // Default sales account
        TaxType: 'NONE', // VAT is included in line items or handled separately
      })),
      // Add shipping as separate line item if applicable
      ...(order.total - order.subtotal - order.vatAmount > 0
        ? [
            {
              Description: 'Shipping',
              Quantity: 1,
              UnitAmount: order.total - order.subtotal - order.vatAmount,
              AccountCode: process.env.XERO_SHIPPING_ACCOUNT_CODE || '200',
              TaxType: 'NONE',
            },
          ]
        : []),
    ],
  };

  const result = await createXeroInvoice(token, invoice);

  return result.Invoices[0].InvoiceID;
}

