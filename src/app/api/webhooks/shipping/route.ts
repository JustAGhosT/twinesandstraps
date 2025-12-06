/**
 * Shipping webhook handler for delivery status updates
 * Handles webhooks from The Courier Guy and other shipping providers
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendEmail } from '@/lib/email/brevo';
import { checkRateLimit, getClientIdentifier, RATE_LIMITS } from '@/lib/rate-limit';

import { logInfo, logError, logWarn, logDebug } from '@/lib/logging/logger';

/**
 * Map The Courier Guy status to our order status
 */
function mapTCGStatus(tcgStatus: string): string {
  const statusMap: Record<string, string> = {
    'PICKED_UP': 'SHIPPED',
    'IN_TRANSIT': 'SHIPPED',
    'OUT_FOR_DELIVERY': 'SHIPPED',
    'DELIVERED': 'DELIVERED',
    'FAILED': 'SHIPPING_FAILED',
    'RETURNED': 'RETURNED',
  };

  return statusMap[tcgStatus] || 'SHIPPED';
}

/**
 * Send shipping update email to customer
 */
async function sendShippingUpdateEmail(
  customerEmail: string,
  orderNumber: string,
  status: string,
  trackingUrl?: string
) {
  const statusMessages: Record<string, { subject: string; body: string }> = {
    SHIPPED: {
      subject: `Your order ${orderNumber} has been shipped`,
      body: `Your order ${orderNumber} has been shipped and is on its way to you.`,
    },
    DELIVERED: {
      subject: `Your order ${orderNumber} has been delivered`,
      body: `Great news! Your order ${orderNumber} has been delivered.`,
    },
    SHIPPING_FAILED: {
      subject: `Update on your order ${orderNumber}`,
      body: `We encountered an issue with the delivery of your order ${orderNumber}. Our team will contact you shortly.`,
    },
    RETURNED: {
      subject: `Update on your order ${orderNumber}`,
      body: `Your order ${orderNumber} has been returned. Our team will contact you to arrange a new delivery.`,
    },
  };

  const message = statusMessages[status] || statusMessages.SHIPPED;

  const emailBody = `
    <h2>${message.subject}</h2>
    <p>${message.body}</p>
    ${trackingUrl ? `<p><a href="${trackingUrl}">Track your order</a></p>` : ''}
    <p>If you have any questions, please contact us at info@twinesandstraps.co.za</p>
  `;

  try {
    await sendEmail({
      to: customerEmail,
      subject: message.subject,
      html: emailBody,
    });
  } catch (error) {
    logError('Failed to send shipping update email:', error);
    // Don't fail the webhook if email fails
  }
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientId = getClientIdentifier(request);
    const rateLimit = checkRateLimit(
      `shipping-webhook:${clientId}`,
      RATE_LIMITS.paymentWebhook.maxRequests,
      RATE_LIMITS.paymentWebhook.windowMs
    );

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many requests' },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil((rateLimit.resetAt - Date.now()) / 1000).toString(),
          },
        }
      );
    }

    const body = await request.json();

    // Extract provider from headers or body
    const provider = request.headers.get('X-Provider') || body.provider || 'TCG';
    const waybillNumber = body.waybill_number || body.waybillNumber;
    const status = body.status;
    const reference = body.reference || body.order_reference;

    if (!waybillNumber || !status) {
      return NextResponse.json(
        { error: 'Missing required fields: waybill_number, status' },
        { status: 400 }
      );
    }

    // Find order by waybill number or reference
    let order;
    if (reference) {
      order = await prisma.order.findFirst({
        where: {
          OR: [
            { order_number: reference },
            { id: parseInt(reference, 10) || 0 },
          ],
        },
        include: {
          user: true,
        },
      });
    }

    if (!order && waybillNumber) {
      // Try to find by tracking number
      order = await prisma.order.findFirst({
        where: {
          tracking_number: waybillNumber,
        },
        include: {
          user: true,
        },
      });
    }

    if (!order) {
      logWarn('Order not found for webhook:', { waybillNumber, reference, provider });
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Map provider status to our order status
    const orderStatus = mapTCGStatus(status);

    // Create order status history entry
    await prisma.orderStatusHistory.create({
      data: {
        order_id: order.id,
        status: orderStatus,
        notes: `Shipping update: ${body.description || body.message || status}${body.location ? ` - Location: ${body.location}` : ''}${waybillNumber ? ` - Waybill: ${waybillNumber}` : ''}`,
      },
    });

    // Update order tracking number if waybill provided
    if (waybillNumber && !order.tracking_number) {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          tracking_number: waybillNumber,
        },
      });
    }

    // Update order status if delivered
    if (orderStatus === 'DELIVERED') {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: 'DELIVERED',
          delivered_at: new Date(),
        },
      });
    } else if (orderStatus === 'SHIPPED' && order.status !== 'SHIPPED') {
      // Update to shipped if not already shipped
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: 'SHIPPED',
        },
      });
    }

    // Send email notification to customer
    if (order.user?.email) {
      await sendShippingUpdateEmail(
        order.user.email,
        order.order_number,
        orderStatus,
        order.tracking_url || undefined
      );
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderNumber: order.order_number,
      status: orderStatus,
    });
  } catch (error) {
    logError('Shipping webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

