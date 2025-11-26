import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdminAuth } from '@/lib/admin-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = await requireAdminAuth(request);
  if (authError) return authError;

  try {
    const customerId = parseInt(params.id);

    if (isNaN(customerId)) {
      return NextResponse.json(
        { error: 'Invalid customer ID' },
        { status: 400 }
      );
    }

    const customer = await prisma.user.findUnique({
      where: { id: customerId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        marketing_consent: true,
        created_at: true,
        last_login: true,
        addresses: true,
        orders: {
          select: {
            id: true,
            order_number: true,
            status: true,
            payment_status: true,
            total: true,
            created_at: true,
            _count: {
              select: { items: true },
            },
          },
          orderBy: { created_at: 'desc' },
          take: 10,
        },
        _count: {
          select: {
            orders: true,
            addresses: true,
            view_history: true,
          },
        },
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Get total spent
    const orderStats = await prisma.order.aggregate({
      where: {
        user_id: customerId,
        status: { not: 'CANCELLED' },
      },
      _sum: { total: true },
      _count: true,
    });

    return NextResponse.json({
      customer: {
        ...customer,
        total_spent: orderStats._sum.total || 0,
        completed_orders: orderStats._count,
      },
    });
  } catch (error) {
    console.error('Error fetching customer:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customer' },
      { status: 500 }
    );
  }
}
