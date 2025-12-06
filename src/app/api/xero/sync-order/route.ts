/**
 * API endpoint to sync an order to Xero as an invoice
 */

import { requireAdminAuth } from '@/lib/admin-auth';
import prisma from '@/lib/prisma';
import { requireCsrfToken } from '@/lib/security/csrf';
import { getRateLimitConfig, withRateLimit } from '@/lib/security/rate-limit-wrapper';
import { syncOrderToXero } from '@/lib/xero/invoices';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { getActiveXeroToken } from '@/lib/xero/token-storage';

const syncOrderSchema = z.object({
  orderId: z.number().int().positive(),
});

async function handlePOST(request: NextRequest) {
  // Verify CSRF token
  const csrfError = requireCsrfToken(request);
  if (csrfError) return csrfError;

  // Verify admin authentication
  const authError = await requireAdminAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const validation = syncOrderSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { orderId } = validation.data;

    // Fetch order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        items: true,
        shipping_address: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Get Xero token from database
    const xeroToken = await getActiveXeroToken();
    if (!xeroToken) {
      return NextResponse.json(
        { error: 'Xero is not connected. Please connect your Xero account first.' },
        { status: 400 }
      );
    }

    // Sync to Xero
    const invoiceId = await syncOrderToXero(xeroToken, {
      orderNumber: order.order_number,
      customerName: order.user.name,
      customerEmail: order.user.email,
      customerPhone: order.user.phone || undefined,
      shippingAddress: order.shipping_address
        ? {
            street_address: order.shipping_address.street_address,
            city: order.shipping_address.city,
            province: order.shipping_address.province,
            postal_code: order.shipping_address.postal_code,
            country: order.shipping_address.country,
          }
        : undefined,
      items: order.items.map(item => ({
        productName: item.product_name,
        quantity: item.quantity,
        unitPrice: item.unit_price,
      })),
      subtotal: order.subtotal,
      vatAmount: order.vat_amount,
      total: order.total,
      date: order.created_at,
    });

    // Store Xero invoice ID in order (you may want to add a xero_invoice_id field)
    // await prisma.order.update({
    //   where: { id: orderId },
    //   data: { xero_invoice_id: invoiceId },
    // });

    return NextResponse.json({
      success: true,
      invoiceId,
      message: 'Order synced to Xero successfully',
    });
  } catch (error: any) {
    console.error('Error syncing order to Xero:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to sync order to Xero' },
      { status: 500 }
    );
  }
}

export const POST = withRateLimit(handlePOST, getRateLimitConfig('admin'));

