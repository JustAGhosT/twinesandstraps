import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdminAuth } from '@/lib/admin-auth';
import { Prisma } from '@prisma/client';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = await requireAdminAuth(request);
  if (authError) return authError;

  try {
    const orderId = parseInt(params.id);

    if (isNaN(orderId)) {
      return NextResponse.json(
        { error: 'Invalid order ID' },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true },
        },
        items: {
          include: {
            product: {
              select: { id: true, name: true, image_url: true },
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
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}

// Update order status
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = await requireAdminAuth(request);
  if (authError) return authError;

  try {
    const orderId = parseInt(params.id);
    const body = await request.json();
    const { status, payment_status, tracking_number, notes } = body;

    if (isNaN(orderId)) {
      return NextResponse.json(
        { error: 'Invalid order ID' },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};
    const statusHistoryData: { status: string; notes?: string }[] = [];

    // Update order status
    if (status && status !== order.status) {
      updateData.status = status;
      statusHistoryData.push({
        status,
        notes: notes || `Status updated to ${status}`,
      });

      // Set shipped_at or delivered_at timestamps
      if (status === 'SHIPPED' && !order.shipped_at) {
        updateData.shipped_at = new Date();
      }
      if (status === 'DELIVERED' && !order.delivered_at) {
        updateData.delivered_at = new Date();
      }
    }

    // Update payment status
    if (payment_status && payment_status !== order.payment_status) {
      updateData.payment_status = payment_status;
      statusHistoryData.push({
        status: `Payment: ${payment_status}`,
        notes: notes || `Payment status updated to ${payment_status}`,
      });
    }

    // Update tracking number
    if (tracking_number !== undefined) {
      updateData.tracking_number = tracking_number;
    }

    // Perform update in transaction
    const updatedOrder = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Update the order
      const updated = await tx.order.update({
        where: { id: orderId },
        data: updateData,
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      // Add status history entries
      if (statusHistoryData.length > 0) {
        await tx.orderStatusHistory.createMany({
          data: statusHistoryData.map((entry) => ({
            order_id: orderId,
            status: entry.status,
            notes: entry.notes,
          })),
        });
      }

      return updated;
    });

    return NextResponse.json({
      success: true,
      order: updatedOrder,
    });
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    );
  }
}
