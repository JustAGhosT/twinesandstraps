/**
 * API endpoint for order fulfillment
 * Marks order as processing and creates waybill
 */

import { sendEmail } from '@/lib/email/brevo';
import { getSiteUrl } from '@/lib/env';
import { trackOrderFulfillment } from '@/lib/inventory/tracking';
import prisma from '@/lib/prisma';
import { createWaybillForOrder } from '@/lib/shipping/waybill-creation';
import { requireCsrfToken } from '@/lib/security/csrf';
import { withRateLimit, getRateLimitConfig } from '@/lib/security/rate-limit-wrapper';
import { NextRequest, NextResponse } from 'next/server';

import { logInfo, logError, logWarn, logDebug } from '@/lib/logging/logger';

async function handlePOST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Verify CSRF token
  const csrfError = requireCsrfToken(request);
  if (csrfError) return csrfError;

  try {
    // TODO: Add admin authentication check

    const { id } = await params;
    const orderId = parseInt(id, 10);

    if (isNaN(orderId) || orderId <= 0) {
      return NextResponse.json(
        { error: 'Invalid order ID' },
        { status: 400 }
      );
    }

    // Fetch order with all details
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        shipping_address: true,
        items: true,
        user: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    if (order.status !== 'CONFIRMED' && order.status !== 'PENDING') {
      return NextResponse.json(
        { error: `Order cannot be fulfilled. Current status: ${order.status}` },
        { status: 400 }
      );
    }

    // Update order status to PROCESSING
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'PROCESSING',
        status_history: {
          create: {
            status: 'PROCESSING',
            notes: 'Order fulfillment started',
          },
        },
      },
    });

    // Track inventory movement for order fulfillment
    await trackOrderFulfillment(
      orderId,
      order.items.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
      }))
    );

    // Create waybill
    const waybillResult = await createWaybillForOrder({
      id: order.id,
      order_number: order.order_number,
      shipping_address: order.shipping_address ? {
        street_address: order.shipping_address.street_address,
        city: order.shipping_address.city,
        province: order.shipping_address.province,
        postal_code: order.shipping_address.postal_code,
      } : null,
      items: order.items.map(item => ({
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
      })),
      user: {
        name: order.user.name,
        email: order.user.email,
        phone: order.user.phone,
      },
    });

    // Send delivery notification email
    if (waybillResult.success && waybillResult.waybillNumber) {
      const siteUrl = getSiteUrl();
      const itemsHtml = order.items.map((item, index) => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${index + 1}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.product_name}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        </tr>
      `).join('');

      await sendEmail({
        to: order.user.email,
        subject: `Your Order #${order.order_number} Has Shipped!`,
        htmlContent: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #E31E24; color: white; padding: 20px; text-align: center; }
              .content { background-color: #f9f9f9; padding: 20px; }
              .cta-button { display: inline-block; background-color: #E31E24; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
              .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Your Order Has Shipped!</h1>
              </div>
              <div class="content">
                <p>Hi ${order.user.name},</p>
                <p>Great news! Your order #${order.order_number} has been shipped and is on its way to you.</p>
                
                <p><strong>Tracking Number:</strong> ${waybillResult.waybillNumber}</p>
                <p><strong>Order Items:</strong></p>
                <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                  <thead>
                    <tr style="background-color: #f5f5f5;">
                      <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">#</th>
                      <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Product</th>
                      <th style="padding: 10px; text-align: center; border-bottom: 2px solid #ddd;">Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${itemsHtml}
                  </tbody>
                </table>

                <div style="text-align: center;">
                  <a href="${siteUrl}/orders/${order.order_number}" class="cta-button">Track Your Order</a>
                </div>

                <p>You can track your order using the tracking number above or by visiting your order page.</p>
                <p>Thank you for your order!</p>
              </div>
              <div class="footer">
                <p>TASSA - Twines and Straps SA</p>
              </div>
            </div>
          </body>
          </html>
        `,
        tags: ['order-shipped', 'delivery-notification'],
      });
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      waybillNumber: waybillResult.waybillNumber,
      trackingUrl: waybillResult.trackingUrl,
    });
  } catch (error) {
    logError('Error fulfilling order:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

