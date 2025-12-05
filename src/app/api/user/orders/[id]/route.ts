import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/user-auth';
import { NextRequest, NextResponse } from 'next/server';

// Get order details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = getCurrentUser(request);

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    // Optimized: Single query using OR condition instead of two separate queries
    const orderId = parseInt(id);
    const isNumericId = !isNaN(orderId) && orderId > 0;

    const order = await prisma.order.findFirst({
      where: {
        user_id: user.userId,
        OR: isNumericId
          ? [
              { order_number: id },
              { id: orderId },
            ]
          : [{ order_number: id }],
      },
      include: {
        items: {
          include: {
            product: {
              select: { id: true, name: true, image_url: true, sku: true },
            },
          },
        },
        shipping_address: true,
        billing_address: true,
        status_history: {
          orderBy: { created_at: 'desc' },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 });
  }
}
