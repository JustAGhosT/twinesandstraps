/**
 * Quote to Order Conversion
 * Converts accepted quotes into orders and generates payment links
 */

import prisma from '../prisma';
import { getQuote, acceptQuote, type QuoteStatus } from './quote-management';
import { generateCheckoutUrl } from '../payfast/checkout';
import { getSiteUrl } from '../env';

export interface ConvertQuoteToOrderResult {
  success: boolean;
  orderId?: number;
  orderNumber?: string;
  paymentUrl?: string;
  error?: string;
}

/**
 * Convert an accepted quote to an order
 */
export async function convertQuoteToOrder(
  quoteId: number,
  userId?: number
): Promise<ConvertQuoteToOrderResult> {
  try {
    // Get the quote with all details
    const quote = await getQuote(quoteId);

    if (!quote) {
      return {
        success: false,
        error: 'Quote not found',
      };
    }

    if (quote.status !== 'ACCEPTED') {
      return {
        success: false,
        error: `Quote must be ACCEPTED to convert to order. Current status: ${quote.status}`,
      };
    }

    if (quote.converted_to_order_id) {
      return {
        success: false,
        error: 'Quote has already been converted to an order',
      };
    }

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

    // Create order from quote
    const order = await prisma.order.create({
      data: {
        order_number: orderNumber,
        user_id: userId || 1, // Default user or guest
        status: 'PENDING',
        payment_status: 'PENDING',
        payment_method: 'QUOTE',
        subtotal: quote.subtotal,
        vat_amount: quote.vat_amount,
        shipping_cost: 0, // Can be updated later
        total: quote.total,
        notes: `Converted from quote ${quote.quote_number}`,
        items: {
          create: quote.items.map(item => ({
            product_id: item.product_id || undefined,
            product_name: item.product_name,
            product_sku: item.product_sku || '',
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.total_price,
          })),
        },
        status_history: {
          create: {
            status: 'PENDING',
            notes: `Order created from quote ${quote.quote_number}`,
          },
        },
      },
    });

    // Update quote to link to order
    await prisma.quote.update({
      where: { id: quoteId },
      data: {
        converted_to_order_id: order.id,
        accepted_at: new Date(),
      },
    });

    // Generate payment link
    const paymentUrl = generateCheckoutUrl({
      customerEmail: quote.customer_email,
      customerFirstName: quote.customer_name.split(' ')[0] || '',
      customerLastName: quote.customer_name.split(' ').slice(1).join(' ') || '',
      customerPhone: quote.customer_phone || '',
      paymentId: orderNumber,
      items: quote.items.map(item => ({
        name: item.product_name,
        price: item.unit_price,
        quantity: item.quantity,
      })),
      returnUrl: `${getSiteUrl()}/checkout/success?payment_id=${orderNumber}`,
      cancelUrl: `${getSiteUrl()}/checkout/cancel`,
    });

    return {
      success: true,
      orderId: order.id,
      orderNumber: order.order_number,
      paymentUrl,
    };
  } catch (error) {
    console.error('Error converting quote to order:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Accept a quote and convert it to an order
 */
export async function acceptQuoteAndConvert(quoteId: number, userId?: number): Promise<ConvertQuoteToOrderResult> {
  // First accept the quote
  await acceptQuote(quoteId);

  // Then convert to order
  return await convertQuoteToOrder(quoteId, userId);
}

