/**
 * PayFast ITN (Instant Transaction Notification) webhook handler
 * Receives payment status updates from PayFast
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPayFastConfig, isPayFastConfigured } from '@/lib/payfast/config';
import { validateSignature, parseITNData } from '@/lib/payfast/signature';
import { checkRateLimit, getClientIdentifier, RATE_LIMITS } from '@/lib/rate-limit';
import { sendOrderConfirmation } from '@/lib/email/brevo';
import { syncPaymentToXero } from '@/lib/xero/payments';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    if (!isPayFastConfigured()) {
      return NextResponse.json(
        { error: 'PayFast not configured' },
        { status: 500 }
      );
    }

    // Rate limiting - prevent abuse
    const clientId = getClientIdentifier(request);
    const rateLimit = checkRateLimit(
      `payfast:${clientId}`,
      RATE_LIMITS.paymentWebhook.maxRequests,
      RATE_LIMITS.paymentWebhook.windowMs
    );

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil((rateLimit.resetAt - Date.now()) / 1000).toString(),
            'X-RateLimit-Limit': RATE_LIMITS.paymentWebhook.maxRequests.toString(),
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': new Date(rateLimit.resetAt).toISOString(),
          },
        }
      );
    }

    const config = getPayFastConfig();
    const formData = await request.formData();
    const itnData = parseITNData(formData as any);

    // Validate signature
    if (!validateSignature(itnData, config.passphrase)) {
      console.error('Invalid PayFast signature:', itnData);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Extract payment information
    const paymentId = itnData.m_payment_id;
    const paymentStatus = itnData.payment_status;
    const pfPaymentId = itnData.pf_payment_id;
    const amount = parseFloat(itnData.amount_gross || '0');

    console.log('PayFast ITN received:', {
      paymentId,
      paymentStatus,
      pfPaymentId,
      amount,
    });

    // Handle different payment statuses
    switch (paymentStatus) {
      case 'COMPLETE':
        // Payment successful - update order status
        await handlePaymentSuccess(paymentId, pfPaymentId, amount, itnData);
        break;

      case 'FAILED':
      case 'CANCELLED':
        // Payment failed or cancelled
        await handlePaymentFailure(paymentId, paymentStatus);
        break;

      case 'PENDING':
        // Payment pending (e.g., EFT)
        await handlePaymentPending(paymentId, pfPaymentId);
        break;

      default:
        console.warn('Unknown payment status:', paymentStatus);
    }

    // PayFast expects a specific response format
    return new NextResponse('OK', {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
        'X-RateLimit-Limit': RATE_LIMITS.paymentWebhook.maxRequests.toString(),
        'X-RateLimit-Remaining': rateLimit.remaining.toString(),
        'X-RateLimit-Reset': new Date(rateLimit.resetAt).toISOString(),
      },
    });
  } catch (error) {
    console.error('PayFast ITN error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Handle successful payment
 */
async function handlePaymentSuccess(
  paymentId: string,
  pfPaymentId: string,
  amount: number,
  itnData: Record<string, string>
) {
  try {
    // Find order by order_number (which is used as m_payment_id in PayFast)
    const order = await prisma.order.findUnique({
      where: { order_number: paymentId },
      include: {
        user: true,
        items: {
          include: {
            product: true,
          },
        },
        shipping_address: true,
        xero_invoice: true,
      },
    });

    if (!order) {
      console.error(`Order not found for payment ID: ${paymentId}`);
      return;
    }

    // Update order payment status
    await prisma.order.update({
      where: { id: order.id },
      data: {
        payment_status: 'PAID',
        status: 'CONFIRMED',
        payment_method: `PayFast - ${itnData.payment_method || 'Unknown'}`,
        status_history: {
          create: {
            status: 'CONFIRMED',
            notes: `Payment received via PayFast (${pfPaymentId})`,
          },
        },
      },
    });

    // Sync payment to Xero if invoice exists
    if (order.xero_invoice) {
      try {
        await syncPaymentToXero(
          order.id,
          amount,
          new Date(),
          pfPaymentId
        );
        console.log(`Payment synced to Xero for order ${order.order_number}`);
      } catch (xeroError: any) {
        console.error('Failed to sync payment to Xero:', xeroError);
        // Don't fail the whole webhook if Xero sync fails
      }
    }

    // Send confirmation email
    const customerEmail = order.user.email || itnData.email_address || '';
    if (customerEmail) {
      await sendOrderConfirmation(customerEmail, {
        orderId: order.order_number,
        items: order.items.map(item => ({
          name: item.product_name,
          quantity: item.quantity,
          price: item.unit_price,
        })),
        total: order.total,
        shippingAddress: order.shipping_address
          ? `${order.shipping_address.street_address}, ${order.shipping_address.city}, ${order.shipping_address.province} ${order.shipping_address.postal_code}`
          : undefined,
      });
    }

    console.log('Payment successful:', { paymentId, pfPaymentId, amount, orderId: order.id });
  } catch (error) {
    console.error('Error handling payment success:', error);
    throw error;
  }
}

/**
 * Handle failed payment
 */
async function handlePaymentFailure(paymentId: string, status: string) {
  try {
    const order = await prisma.order.findUnique({
      where: { order_number: paymentId },
    });

    if (order) {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          payment_status: 'FAILED',
          status_history: {
            create: {
              status: order.status,
              notes: `Payment ${status} via PayFast`,
            },
          },
        },
      });
    }

    console.log('Payment failed:', { paymentId, status });
  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
}

/**
 * Handle pending payment (e.g., EFT)
 */
async function handlePaymentPending(paymentId: string, pfPaymentId: string) {
  try {
    const order = await prisma.order.findUnique({
      where: { order_number: paymentId },
    });

    if (order) {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          payment_status: 'PENDING',
          status_history: {
            create: {
              status: 'PENDING',
              notes: `Payment pending via PayFast (${pfPaymentId})`,
            },
          },
        },
      });
    }

    console.log('Payment pending:', { paymentId, pfPaymentId });
  } catch (error) {
    console.error('Error handling payment pending:', error);
  }
}

