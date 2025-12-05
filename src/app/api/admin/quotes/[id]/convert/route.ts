/**
 * API endpoint to convert a quote to an order
 */

import { NextRequest, NextResponse } from 'next/server';
import { convertQuoteToOrder, acceptQuoteAndConvert } from '@/lib/quotes/quote-to-order';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // TODO: Add admin authentication check
    // const admin = await getAdminUser(request);
    // if (!admin) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const { id } = await params;
    const quoteId = parseInt(id, 10);

    if (isNaN(quoteId) || quoteId <= 0) {
      return NextResponse.json(
        { error: 'Invalid quote ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { acceptFirst = false, userId } = body;

    let result;
    if (acceptFirst) {
      result = await acceptQuoteAndConvert(quoteId, userId);
    } else {
      result = await convertQuoteToOrder(quoteId, userId);
    }

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to convert quote to order' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      orderId: result.orderId,
      orderNumber: result.orderNumber,
      paymentUrl: result.paymentUrl,
    });
  } catch (error) {
    console.error('Error converting quote to order:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

