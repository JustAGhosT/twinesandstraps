/**
 * PayFast checkout URL generation
 * Creates secure payment URLs for redirecting customers to PayFast
 */

import { getSiteUrl } from '@/lib/env';
import { getPayFastConfig } from './config';
import { generateSignature, type PayFastData } from './signature';

export interface CheckoutItem {
  name: string;
  price: number;
  quantity: number;
}

export interface CheckoutOptions {
  customerEmail: string;
  customerFirstName?: string;
  customerLastName?: string;
  customerPhone?: string;
  paymentId: string; // Unique payment/order ID
  items: CheckoutItem[];
  returnUrl?: string;
  cancelUrl?: string;
  notifyUrl?: string;
}

/**
 * Generate PayFast checkout URL
 */
export function generateCheckoutUrl(options: CheckoutOptions): string {
  const config = getPayFastConfig();
  if (!config.merchantId || !config.merchantKey || !config.passphrase) {
    throw new Error('PayFast is not configured. Please set PAYFAST_MERCHANT_ID, PAYFAST_MERCHANT_KEY, and PAYFAST_PASSPHRASE environment variables.');
  }

  const siteUrl = getSiteUrl();

  // Calculate total amount
  const totalAmount = options.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // Build item name (combine all items if multiple)
  const itemName = options.items.length === 1
    ? options.items[0].name
    : `${options.items.length} items from TASSA`;

  // Prepare PayFast data
  const payfastData: PayFastData = {
    merchant_id: config.merchantId,
    merchant_key: config.merchantKey,
    return_url: options.returnUrl || `${siteUrl}/checkout/success`,
    cancel_url: options.cancelUrl || `${siteUrl}/checkout/cancel`,
    notify_url: options.notifyUrl || `${siteUrl}${config.itnUrl}`,
    name_first: options.customerFirstName || '',
    name_last: options.customerLastName || '',
    email_address: options.customerEmail,
    cell_number: options.customerPhone || '',
    m_payment_id: options.paymentId,
    amount: totalAmount.toFixed(2),
    item_name: itemName,
  };

  // Remove empty optional fields
  Object.keys(payfastData).forEach(key => {
    if (payfastData[key] === '') {
      delete payfastData[key];
    }
  });

  // Generate signature
  const signature = generateSignature(payfastData, config.passphrase);
  payfastData.signature = signature;

  // Build query string
  const queryString = Object.keys(payfastData)
    .filter(key => payfastData[key] !== undefined && payfastData[key] !== '')
    .map(key => `${key}=${encodeURIComponent(payfastData[key]!)}`)
    .join('&');

  return `${config.url}?${queryString}`;
}

/**
 * Validate payment ID format
 */
export function validatePaymentId(paymentId: string): boolean {
  // Payment ID should be alphanumeric, max 100 characters
  return /^[a-zA-Z0-9_-]{1,100}$/.test(paymentId);
}

