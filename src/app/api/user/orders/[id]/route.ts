import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/user-auth';

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
    // Try to find by order number first, then by ID
    let order = await prisma.order.findFirst({
      where: {
        order_number: id,
        user_id: user.userId,
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

    // If not found by order number, try by ID
    if (!order) {
      const orderId = parseInt(id);
      if (!isNaN(orderId)) {
        order = await prisma.order.findFirst({
          where: {
            id: orderId,
            user_id: user.userId,
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
      }
    }

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 });
  }
}
