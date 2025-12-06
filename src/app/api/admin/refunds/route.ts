/**
 * Admin API for processing refunds
 * Requires admin authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { processRefund } from '@/lib/payfast/refund';
import { requireAdminAuth } from '@/lib/admin-auth';
import { requireCsrfToken } from '@/lib/security/csrf';
import { getRateLimitConfig, withRateLimit } from '@/lib/security/rate-limit-wrapper';
import { sendEmail } from '@/lib/email/brevo';
import prisma from '@/lib/prisma';
import { z } from 'zod';

import { logInfo, logError, logWarn, logDebug } from '@/lib/logging/logger';

const refundSchema = z.object({
  orderId: z.number().int().positive(),
  pfPaymentId: z.string().min(1, 'PayFast payment ID is required'),
  amount: z.number().positive().optional(),
  reason: z.string().optional(),
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
    const validation = refundSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { orderId, pfPaymentId, amount, reason } = validation.data;

    // Get order details
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true, items: true },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Process refund via PayFast
    const result = await processRefund({
      pfPaymentId,
      amount,
      reason,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Refund failed' },
        { status: 400 }
      );
    }

    // Update order status
    await prisma.order.update({
      where: { id: orderId },
      data: {
        payment_status: amount && amount < order.total ? 'PARTIALLY_REFUNDED' : 'REFUNDED',
        status: 'CANCELLED',
      },
    });

    // Create status history entry
    await prisma.orderStatusHistory.create({
      data: {
        order_id: orderId,
        status: 'CANCELLED',
        notes: `Refund processed${amount ? ` (Partial: R${amount.toFixed(2)})` : ' (Full)'}${reason ? `. Reason: ${reason}` : ''}`,
      },
    });

    // Send refund confirmation email
    if (order.user?.email) {
      try {
        await sendEmail({
          to: order.user.email,
          subject: `Refund Processed - Order ${order.order_number}`,
          htmlContent: `
            <h2>Refund Processed</h2>
            <p>Dear ${order.user.name},</p>
            <p>We have processed a refund for your order <strong>${order.order_number}</strong>.</p>
            ${amount ? `<p><strong>Refund Amount:</strong> R${amount.toFixed(2)}</p>` : `<p><strong>Refund Amount:</strong> R${order.total.toFixed(2)} (Full refund)</p>`}
            ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
            <p>The refund will be processed to your original payment method within 5-10 business days.</p>
            <p>If you have any questions, please contact us at info@twinesandstraps.co.za</p>
            <p>Thank you,<br>TASSA - Twines and Straps SA</p>
          `,
          tags: ['refund', 'order-update'],
        });
      } catch (emailError) {
        logError('Failed to send refund confirmation email:', emailError);
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({
      success: true,
      refundId: result.refundId,
      message: 'Refund processed successfully',
      orderNumber: order.order_number,
    });
  } catch (error) {
    logError('Refund API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export const POST = withRateLimit(handlePOST, getRateLimitConfig('admin'));

