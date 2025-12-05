/**
 * PayFast ITN (Instant Transaction Notification) webhook handler
 * Receives payment status updates from PayFast
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPayFastConfig, isPayFastConfigured } from '@/lib/payfast/config';
import { validateSignature, parseITNData } from '@/lib/payfast/signature';
import { checkRateLimit, getClientIdentifier, RATE_LIMITS } from '@/lib/rate-limit';
import { sendOrderConfirmation } from '@/lib/email/brevo';
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
    // Find order by payment ID
    // Note: You'll need to create an Order model in Prisma if it doesn't exist
    // For now, this is a placeholder implementation
    
    // TODO: Update order status in database
    // const order = await prisma.order.update({
    //   where: { payment_id: paymentId },
    //   data: {
    //     status: 'PAID',
    //     payment_status: 'COMPLETE',
    //     payment_id: pfPaymentId,
    //     paid_at: new Date(),
    //   },
    //   include: {
    //     items: {
    //       include: {
    //         product: true,
    //       },
    //     },
    //   },
    // });

    // Send confirmation email
    const customerEmail = itnData.email_address || '';
    if (customerEmail) {
      // TODO: Replace with actual order data when Order model is implemented
      await sendOrderConfirmation(customerEmail, {
        orderId: paymentId,
        items: [], // order.items.map(item => ({ ... }))
        total: amount,
        shippingAddress: '', // order.shipping_address
      });
    }

    console.log('Payment successful:', { paymentId, pfPaymentId, amount });
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
    // TODO: Update order status
    // await prisma.order.update({
    //   where: { payment_id: paymentId },
    //   data: {
    //     status: 'FAILED',
    //     payment_status: status,
    //   },
    // });

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
    // TODO: Update order status
    // await prisma.order.update({
    //   where: { payment_id: paymentId },
    //   data: {
    //     status: 'PENDING',
    //     payment_status: 'PENDING',
    //     payment_id: pfPaymentId,
    //   },
    // });

    console.log('Payment pending:', { paymentId, pfPaymentId });
  } catch (error) {
    console.error('Error handling payment pending:', error);
  }
}

