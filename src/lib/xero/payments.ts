/**
 * Xero Payment Receipt Management
 * Sync payment receipts from PayFast to Xero invoices
 */

import { XeroToken } from './auth';
import { getActiveXeroToken } from './token-storage';
import prisma from '@/lib/prisma';

import { logInfo, logError, logWarn, logDebug } from '@/lib/logging/logger';

export interface XeroPayment {
  Invoice: {
    InvoiceID: string;
  };
  Account: {
    Code: string; // Payment account code (e.g., PayFast clearing account)
  };
  Date: string; // ISO date string
  Amount: number;
  Reference?: string;
}

export interface XeroPaymentResponse {
  Payments: Array<{
    PaymentID: string;
    Amount: number;
    Status: string;
  }>;
}

/**
 * Get valid Xero access token
 */
async function getValidAccessToken(): Promise<string> {
  const token = await getActiveXeroToken();
  if (!token) {
    throw new Error('Xero is not connected. Please connect your Xero account first.');
  }
  return token.accessToken;
}

/**
 * Create payment in Xero to match an invoice
 */
export async function createXeroPayment(
  invoiceId: string,
  amount: number,
  paymentDate: Date,
  reference?: string
): Promise<string> {
  const accessToken = await getValidAccessToken();
  const tenantId = process.env.XERO_TENANT_ID || '';

  // Get payment account code from environment (PayFast clearing account)
  const paymentAccountCode = process.env.XERO_PAYMENT_ACCOUNT_CODE || '090';

  const payment: XeroPayment = {
    Invoice: {
      InvoiceID: invoiceId,
    },
    Account: {
      Code: paymentAccountCode,
    },
    Date: paymentDate.toISOString().split('T')[0],
    Amount: amount,
    Reference: reference,
  };

  const response = await fetch('https://api.xero.com/api.xro/2.0/Payments', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Xero-tenant-id': tenantId,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ Payments: [payment] }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create payment: ${error}`);
  }

  const data: XeroPaymentResponse = await response.json();
  return data.Payments[0].PaymentID;
}

/**
 * Sync PayFast payment to Xero
 * Finds the invoice for the order and creates a payment receipt
 */
export async function syncPaymentToXero(
  orderId: number,
  amount: number,
  paymentDate: Date,
  paymentReference: string
): Promise<string | null> {
  try {
    // Find the invoice mapping for this order
    const invoiceMapping = await prisma.xeroInvoiceMapping.findUnique({
      where: { order_id: orderId },
    });

    if (!invoiceMapping) {
      logWarn(`No Xero invoice found for order ${orderId}. Invoice must be synced first.`);
      return null;
    }

    // Check if payment already exists (avoid duplicates)
    // Note: Xero API doesn't have a direct way to check existing payments
    // You may want to store payment mappings in database

    // Create payment in Xero
    const paymentId = await createXeroPayment(
      invoiceMapping.xero_invoice_id,
      amount,
      paymentDate,
      `PayFast: ${paymentReference}`
    );

    return paymentId;
  } catch (error: any) {
    logError('Error syncing payment to Xero:', error);
    throw error;
  }
}

/**
 * Get invoice balance in Xero
 */
export async function getInvoiceBalance(invoiceId: string): Promise<number> {
  const accessToken = await getValidAccessToken();
  const tenantId = process.env.XERO_TENANT_ID || '';

  const response = await fetch(
    `https://api.xero.com/api.xro/2.0/Invoices/${invoiceId}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Xero-tenant-id': tenantId,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch invoice');
  }

  const data = await response.json();
  const invoice = data.Invoices?.[0];

  if (!invoice) {
    throw new Error('Invoice not found');
  }

  // Return amount due (balance)
  return invoice.AmountDue || 0;
}

/**
 * Handle partial payments
 * Creates payment for the amount received
 */
export async function handlePartialPayment(
  invoiceId: string,
  amount: number,
  paymentDate: Date,
  reference?: string
): Promise<string> {
  const balance = await getInvoiceBalance(invoiceId);
  
  if (amount > balance) {
    throw new Error(`Payment amount (${amount}) exceeds invoice balance (${balance})`);
  }

  return createXeroPayment(invoiceId, amount, paymentDate, reference);
}

