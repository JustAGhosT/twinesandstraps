/**
 * Admin API for processing refunds
 * Requires admin authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { processRefund } from '@/lib/payfast/refund';
import { z } from 'zod';

const refundSchema = z.object({
  pfPaymentId: z.string().min(1, 'PayFast payment ID is required'),
  amount: z.number().positive().optional(),
  reason: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // TODO: Add admin authentication check
    // const admin = await getAdminUser(request);
    // if (!admin) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const body = await request.json();
    const validation = refundSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.errors },
        { status: 400 }
      );
    }

    const result = await processRefund(validation.data);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Refund failed' },
        { status: 400 }
      );
    }

    // TODO: Update order status in database
    // TODO: Send refund confirmation email

    return NextResponse.json({
      success: true,
      refundId: result.refundId,
      message: 'Refund processed successfully',
    });
  } catch (error) {
    console.error('Refund API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

